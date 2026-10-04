import {
  loadDbConfig,
  openPool,
  type ShopDbPool,
} from "./shopDbReader.js";
import { healDbAccess } from "./sqlDbAccess.js";

let poolPromise: Promise<ShopDbPool> | undefined;

export async function getShopPool(): Promise<ShopDbPool> {
  if (!poolPromise) {
    poolPromise = openPool(loadDbConfig())
      .catch(async (err) =>
        (await healDbAccess(err))
          ? openPool(loadDbConfig())
          : Promise.reject(err),
      )
      .catch((err) => {
        poolPromise = undefined;
        throw err;
      });
  }
  return poolPromise;
}

export async function closeShopPool(): Promise<void> {
  const pendingPool = poolPromise;
  poolPromise = undefined;
  if (pendingPool) await (await pendingPool.catch(() => undefined))?.close();
}
