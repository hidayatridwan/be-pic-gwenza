import { aiValidation } from "../validations/ai.validation.js";
import { validate } from "../validations/validation.js";
import OpenAI from "openai";
import { prismaClient } from "../apps/database.js";

const streamAiResponse = async (payload, res) => {
    const validatedPayload = validate(aiValidation, payload);
    const { question } = validatedPayload;

    await generateAndStreamQueryAnswer(question, res);

    res.write(`data: [DONE]\n\n`);
    res.end();
};

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_API_URL
});

const SQL_GENERATOR_SYSTEM_PROMPT = `
You are a MySQL query generator for an order management system. Your job is to convert user questions into valid, READ-ONLY MySQL SELECT queries.

TABLE orders (
  order_id int PRIMARY KEY AUTO_INCREMENT,
  channel varchar(100) NOT NULL,        -- Sales channel (tiktok, shopee)
  order_number varchar(100) NOT NULL,   -- Unique order number from each channel
  status enum('OPEN','CLOSED','CANCEL') NOT NULL DEFAULT 'OPEN',
  product_name varchar(255) NOT NULL,
  variant_name varchar(100) NOT NULL,
  quantity int NOT NULL,
  start_date datetime(3),               -- Order creation date
  end_date datetime(3)                  -- Shipping deadline (start_date + 27 days)
)

CONTEXT:
- Orders come from TikTok and Shopee marketplaces
- end_date is always start_date + 27 days (shipping deadline)
- OPEN   = order active, item not yet shipped, MUST be shipped before end_date
- CLOSED = order fulfilled, item successfully shipped
- CANCEL = order canceled, will not be fulfilled
- Deadline monitoring is CRITICAL — OPEN orders approaching or past end_date need immediate attention

URGENCY CLASSIFICATION (for OPEN orders):
- OVERDUE : end_date < NOW()
- H-1     : sisa hari = 1
- H-2~3   : sisa hari 2-3
- H-4~7   : sisa hari 4-7
- AMAN    : sisa hari > 7

STRICT RULES — YOU MUST FOLLOW:
1. ONLY generate SELECT queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, EXEC, or any other non-SELECT statement.
2. If the user asks for anything that modifies data, respond with isValid: false and explain why.
3. If the question is ambiguous or cannot be converted to a query, respond with isValid: false.
4. Never use subqueries that modify data.
5. Never use stored procedures or dynamic SQL.
6. Always use NOW() for current datetime comparisons.
7. Always include ORDER BY for readability when returning lists.
8. LIMIT rules:
    - Default LIMIT is 10 if user does not specify.
    - If user requests a specific LIMIT less than 10 (e.g. "tampilkan 3 order") → use their requested LIMIT.
    - If user requests a LIMIT greater than 10 (e.g. "tampilkan 50 order") → cap it to LIMIT 10.
    - Never allow queries without LIMIT.
9. For quantity/stock questions, always use SUM(quantity) and GROUP BY product_name, variant_name.
    - start_date = tanggal order MASUK/DIBUAT, bukan deadline
    - end_date   = tanggal DEADLINE PENGIRIMAN (start_date + 27 hari)
    - "harus dikirim hari ini" or "deadline hari ini" = DATE(end_date) <= CURDATE()
    - "belum dikirim" or "harus dikirim" = status = 'OPEN'
    - ALWAYS use SUM(quantity) + GROUP BY product_name, variant_name when asking about product quantity or stock to ship
    - NEVER filter by start_date when user asks about shipping deadline

OUTPUT FORMAT (strict JSON, no markdown, no explanation outside JSON):
{
  "query": "Valid SELECT SQL query here",
  "explanation": "Penjelasan singkat query dalam Bahasa Indonesia",
  "isValid": true
}

If invalid or unsafe:
{
  "query": null,
  "explanation": "Alasan mengapa pertanyaan tidak bisa diproses",
  "isValid": false
}

EXAMPLES:

User: "order mana yang sudah melewati deadline tapi belum dikirim?"
{
  "query": "SELECT *, DATEDIFF(NOW(), end_date) AS hari_telat FROM orders WHERE status = 'OPEN' AND end_date < NOW() ORDER BY end_date ASC",
  "explanation": "Menampilkan order OPEN yang sudah melewati end_date, diurutkan dari yang paling lama telat",
  "isValid": true
}

User: "tampilkan semua order open beserta urgensinya"
{
  "query": "SELECT *, DATEDIFF(end_date, NOW()) AS sisa_hari, CASE WHEN end_date < NOW() THEN 'OVERDUE' WHEN DATEDIFF(end_date, NOW()) <= 1 THEN 'H-1' WHEN DATEDIFF(end_date, NOW()) <= 3 THEN 'H-2~3' WHEN DATEDIFF(end_date, NOW()) <= 7 THEN 'H-4~7' ELSE 'AMAN' END AS urgensi FROM orders WHERE status = 'OPEN' ORDER BY end_date ASC",
  "explanation": "Menampilkan semua order OPEN dengan klasifikasi urgensi berdasarkan sisa hari menuju deadline",
  "isValid": true
}

User: "hapus order yang sudah cancel"
{
  "query": null,
  "explanation": "Permintaan ini memerlukan operasi DELETE yang tidak diizinkan. Sistem ini hanya mendukung operasi READ (SELECT).",
  "isValid": false
}

User: "tampilkan 3 order yang paling baru"
{
  "query": "SELECT * FROM orders ORDER BY start_date DESC LIMIT 3",
  "explanation": "Menampilkan 3 order terbaru sesuai permintaan user",
  "isValid": true
}

User: "tampilkan 50 order yang paling baru"
{
  "query": "SELECT * FROM orders ORDER BY start_date DESC LIMIT 10",
  "explanation": "Menampilkan order terbaru, limit maksimal sistem adalah 10 data",
  "isValid": true
}

User: "hari ini ada yang order Asya Dress Motif yang harus dikirim?"
{
  "query": "SELECT product_name, variant_name, SUM(quantity) AS total_qty, COUNT(*) AS total_order FROM orders WHERE status = 'OPEN' AND product_name LIKE '%Asya Dress Motif%' AND DATE(end_date) <= CURDATE() GROUP BY product_name, variant_name ORDER BY product_name LIMIT 10",
  "explanation": "Menampilkan total quantity dan jumlah order OPEN produk Asya Dress Motif yang deadline pengirimannya hari ini atau sudah lewat",
  "isValid": true
}

User: "produk apa saja yang harus dikirim hari ini?"
{
  "query": "SELECT product_name, variant_name, SUM(quantity) AS total_qty, COUNT(*) AS total_order FROM orders WHERE status = 'OPEN' AND DATE(end_date) <= CURDATE() GROUP BY product_name, variant_name ORDER BY product_name LIMIT 10",
  "explanation": "Menampilkan semua produk OPEN yang deadline pengirimannya hari ini atau sudah terlewat, digroup per produk dan varian",
  "isValid": true
}
`;

const streamTextChunk = (res, text) => {
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
};

export const generateAndStreamQueryAnswer = async (question, res) => {
    try {
        const response = await client.chat.completions.create({
            model: process.env.OPENROUTER_MODEL_NAME,
            temperature: 0.1,
            messages: [
                { role: 'system', content: SQL_GENERATOR_SYSTEM_PROMPT },
                { role: 'user', content: question }
            ]
        });

        const queryPlan = JSON.parse(response.choices[0].message.content);
        console.log(queryPlan);

        if (!queryPlan?.isValid || !queryPlan?.query) {
            streamTextChunk(res, queryPlan?.explanation || "Pertanyaan tidak bisa diproses.");
            return;
        }

        const queryResult = await runReadOnlyQuery(queryPlan.query);

        return await streamNaturalLanguageResult({
            question,
            explanation: queryPlan.explanation,
            data: queryResult.data,
            rowCount: queryResult.rowCount,
        }, res);
    } catch (error) {
        console.error('AI Query Generation Error:', error);
        throw new Error(`Gagal generate query: ${error.message}`);
    }
}

async function runReadOnlyQuery(sqlQuery) {
    try {
        const results = await prismaClient.$queryRawUnsafe(sqlQuery);
        return {
            success: true,
            data: results,
            rowCount: results.length
        };
    } catch (error) {
        console.error('Query Execution Error:', error);
        throw new Error(`Gagal eksekusi query: ${error.message}`);
    }
}

const buildFormatterPrompt = ({ question, explanation, data }) => {
    const payload = {
        question,
        explanation,
        resultQuery: data,
    };

    return `
    You are a helpful assistant that presents MySQL query results in a clear,
human-readable format in Indonesian.

You will receive:
- "question"     : the original user question
- "explanation"  : what the query was doing
- "resultQuery"  : the raw data from the database

YOUR JOB:
Convert the resultQuery into a friendly, easy-to-read response in Indonesian.

RULES:
1. Always answer in Bahasa Indonesia
2. Never show raw JSON to the user
3. Format dates to Indonesian format (e.g. 10 Juli 2025, pukul 09.55 WIB)
4. Translate status to human-readable:
   OPEN -> "Belum Dikirim", CLOSED -> "Sudah Dikirim", CANCEL -> "Dibatalkan"
5. If rowCount = 0, say "Tidak ditemukan data yang sesuai."
6. Use simple markdown for readability (bullet points, bold for important info)
7. For deadline-related data, always highlight urgency clearly
8. Keep the response concise - no need to repeat all fields,
   focus on what's most relevant to the question
9. If multiple rows, summarize first then list details
10. Always mention rowCount at the end (e.g. "Total: 2 order ditemukan")

INPUT:
${JSON.stringify(payload, bigIntSerializer, 2)}
    `;
};

async function streamNaturalLanguageResult(data, res) {
    if (data.rowCount === 0) {
        streamTextChunk(res, "Tidak ada data yang ditemukan untuk pertanyaan tersebut.");
        return {
            success: true,
            text: "Tidak ada data yang ditemukan untuk pertanyaan tersebut."
        };
    }

    const resultFormatterPrompt = buildFormatterPrompt(data);

    try {
        const stream = await client.chat.completions.create({
            model: process.env.OPENROUTER_MODEL_NAME,
            temperature: 0.1,
            messages: [
                { role: 'user', content: resultFormatterPrompt }
            ],
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                // Stream chunks to the client as soon as they arrive.
                streamTextChunk(res, content);
            }
        }
    } catch (error) {
        console.error('Formatting error:', error);
        return {
            success: false,
            text: "Terjadi kesalahan saat memformat hasil data."
        };
    }
}

// Custom JSON serializer to handle BigInt values
const bigIntSerializer = (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
};

export default { streamAiResponse };