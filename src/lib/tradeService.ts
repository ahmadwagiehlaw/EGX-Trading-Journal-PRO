import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from './firebase';

export interface TradeDocument {
  id?: string;
  uid: string;
  portfolioType: 'investment' | 'speculation';
  symbol: string;
  status: 'open' | 'won' | 'lost' | 'breakeven';
  entryDate: Timestamp;
  entryPrice: number;
  atr15: number;
  initialStopLoss: number;
  currentStopLoss: number;
  highestPriceSinceEntry: number;
  targetPrice: number;
  sharesCount: number;
  riskAmount: number;
  images: { beforeTradeUrl: string; afterTradeUrl: string };
  checklist: { majorSR: boolean; structureBreak: boolean; retest: boolean };
  marketContext: { makerPlan: string; auctionBehavior: string; closingPrice: number };
  exitDate?: Timestamp;
  exitPrice?: number;
  pnl?: number;
}

const TRADES_COLLECTION = 'trades';

// Helper to convert base64/blob URL to File for Storage
export async function uploadTradeImage(userId: string, tradeId: string, imageUri: string, type: 'before' | 'after'): Promise<string> {
  try {
    const { getStorage } = await import('firebase/storage');
    const storage = getStorage();
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const fileName = `${type}_${Date.now()}.png`;
    const storageRef = ref(storage, `users/${userId}/trades/${tradeId}/${fileName}`);
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export async function createNewTrade(tradeData: Omit<TradeDocument, 'id'>, localImageUris: string[]): Promise<string> {
  try {
    // 1. Save Trade Document
    const docRef = await addDoc(collection(db, TRADES_COLLECTION), tradeData);
    
    // 2. Upload Images if any
    let beforeTradeUrl = '';
    if (localImageUris.length > 0) {
      beforeTradeUrl = await uploadTradeImage(tradeData.uid, docRef.id, localImageUris[0], 'before');
      // Update doc with image url
      await updateDoc(docRef, {
        'images.beforeTradeUrl': beforeTradeUrl
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating new trade:", error);
    throw error;
  }
}

export async function updateTrailingStop(tradeId: string, newHighestPrice: number, newStopLoss: number): Promise<void> {
  try {
    const tradeRef = doc(db, TRADES_COLLECTION, tradeId);
    await updateDoc(tradeRef, {
      highestPriceSinceEntry: newHighestPrice,
      currentStopLoss: newStopLoss
    });
  } catch (error) {
    console.error("Error updating trailing stop:", error);
    throw error;
  }
}

export async function closeTrade(tradeId: string, exitPrice: number, status: 'won' | 'lost' | 'breakeven', pnl: number, localAfterImageUrl?: string): Promise<void> {
  try {
    const tradeRef = doc(db, TRADES_COLLECTION, tradeId);
    
    const updateData: any = {
      exitPrice,
      status,
      pnl,
      exitDate: Timestamp.now()
    };

    if (localAfterImageUrl) {
      // Just a placeholder to show how we'd get UID. In a real scenario we pass it or get from Auth
      const uid = auth.currentUser?.uid || 'anonymous';
      const afterTradeUrl = await uploadTradeImage(uid, tradeId, localAfterImageUrl, 'after');
      updateData['images.afterTradeUrl'] = afterTradeUrl;
    }

    await updateDoc(tradeRef, updateData);
  } catch (error) {
    console.error("Error closing trade:", error);
    throw error;
  }
}

export async function getActiveTrades(uid: string): Promise<TradeDocument[]> {
  try {
    const q = query(
      collection(db, TRADES_COLLECTION), 
      where("uid", "==", uid),
      where("status", "==", "open")
    );
    
    const querySnapshot = await getDocs(q);
    const trades: TradeDocument[] = [];
    querySnapshot.forEach((doc) => {
      trades.push({ id: doc.id, ...doc.data() } as TradeDocument);
    });
    return trades;
  } catch (error) {
    console.error("Error fetching active trades:", error);
    throw error;
  }
}
