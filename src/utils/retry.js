// Kode MySQL yang aman diulang: MySQL sudah me-rollback pekerjaan yang gagal,
// jadi menjalankannya lagi dari awal tidak menggandakan data.
const RETRYABLE_MYSQL_CODES = ["1213", "1205"]; // deadlock, lock wait timeout

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableDbError = (error) => {
  // P2034: write conflict / deadlock pada query Prisma biasa maupun transaksi
  if (error?.code === "P2034") return true;

  // P2010: raw query gagal; kode MySQL-nya ada di meta.code
  return (
    error?.code === "P2010" &&
    RETRYABLE_MYSQL_CODES.includes(String(error.meta?.code))
  );
};

/**
 * Jalankan pekerjaan DB dan ulangi bila terkena deadlock / lock wait timeout.
 * Retry lewat DLQ tidak bisa diandalkan (TTL quorum queue baru didukung
 * RabbitMQ 3.10), jadi deadlock harus selesai di sini. Pekerjaan dijalankan
 * ulang dari awal, maka harus aman diulang.
 * @param {string} label - Nama proses untuk log
 * @param {Function} fn - async () => hasil
 * @param {object} options - { retries, baseDelayMs }
 */
const withDeadlockRetry = async (
  label,
  fn,
  { retries = 3, baseDelayMs = 200 } = {}
) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt > retries || !isRetryableDbError(error)) throw error;

      // Backoff + jitter supaya transaksi yang bentrok tidak bertabrakan lagi
      const delay =
        baseDelayMs * 2 ** (attempt - 1) +
        Math.floor(Math.random() * baseDelayMs);
      console.warn(
        `⚠️  [${label}] Deadlock/lock timeout (${error.code}), ulangi ke-${attempt} dari ${retries} dalam ${delay} ms`
      );
      await sleep(delay);
    }
  }
};

export { isRetryableDbError, withDeadlockRetry };
