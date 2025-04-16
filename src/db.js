// db.js
import { openDB } from 'idb';

const DB_NAME = 'DashboardDB';
const STORE_NAME = 'DashboardStore';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export async function saveToDB(key, value) {
  const db = await getDB();
  await db.put(STORE_NAME, value, key);
}

export async function loadFromDB(key) {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}
