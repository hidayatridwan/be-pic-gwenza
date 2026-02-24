import OpenAI from "openai";
import { prismaClient } from "../apps/database.js";

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

const DATABASE_SCHEMA = `
TABLE orders (
  order_id int PRIMARY KEY AUTO_INCREMENT,
  channel varchar(100) NOT NULL - Sales channel (tiktok, shopee),
  order_number varchar(100) NOT NULL - Unique order number from each channel,
  status enum('OPEN','CLOSED','CANCEL') NOT NULL DEFAULT 'OPEN' - Order status,
  product_name varchar(255) NOT NULL - Product name,
  variant_name varchar(100) NOT NULL - Product variant name,
  quantity int NOT NULL - Quantity of items ordered,
  start_date datetime(3) - Order creation date,
  end_date datetime(3) - Shipping deadline / expiration date
)

CONTEXT:
- This data represents purchase orders from TikTok and Shopee marketplaces
- order_number is the unique order number from each channel
- start_date is the time when the order was created
- end_date is the deadline by which the item must be shipped (expiration date)
`;

const SYSTEM_PROMPT = `You are an expert SQL assistant that helps generate MySQL queries based on user questions in Indonesian.

${DATABASE_SCHEMA}

IMPORTANT RULES:
1. Generate ONLY SELECT queries. DO NOT use INSERT, UPDATE, DELETE, DROP, or ALTER
2. Use correct MySQL syntax
3. Always use backticks for field names when necessary
4. For "today" use: DATE(start_date) = CURDATE()
5. For "this week" use: YEARWEEK(start_date) = YEARWEEK(CURDATE())
6. For "this month" use: MONTH(start_date) = MONTH(CURDATE()) AND YEAR(start_date) = YEAR(CURDATE())
7. For "this year" use: YEAR(start_date) = YEAR(CURDATE())
8. Use aggregation (COUNT, SUM, AVG) for "how many" type questions
9. Use ORDER BY and LIMIT for ranking/top products
10. Handle case-insensitive search using LOWER() or UPPER()

RESPONSE FORMAT (JSON):
{
  "query": "Valid SQL query",
  "explanation": "Brief explanation of the query in Indonesian",
  "queryType": "count|list|aggregate|search",
  "isValid": true
}

If the question cannot be answered with the available data, set isValid: false and provide an explanation.
`;

export const generateQueryPlan = async (question) => {
    try {
        const response = await client.chat.completions.create({
            model: "arcee-ai/trinity-large-preview:free",
            temperature: 0.1,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: question }
            ]
        });

        const resultAI = JSON.parse(response.choices[0].message.content);
        console.log(resultAI);

        const resultQuery = await executeQuery(resultAI.query);
        console.log(resultQuery);

        const resultFormat = await resultFormatted(resultQuery.data, resultQuery.rowCount, question);
        console.log(resultFormat);

        return {
            success: true,
            data: resultAI,
        };
    } catch (error) {
        console.error('AI Query Generation Error:', error);
        throw new Error(`Gagal generate query: ${error.message}`);
    }
}

async function executeQuery(sqlQuery) {
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

async function resultFormatted(data, rowCount, userQuestion) {
    if (rowCount === 0) {
        return {
            formatted: "Tidak ada data yang ditemukan untuk pertanyaan tersebut.",
            format: 'text',
            metadata: { rowCount: 0 }
        };
    }

    const prompt = buildFormattingPrompt(data, rowCount, userQuestion);

    try {
        const response = await client.chat.completions.create({
            model: "arcee-ai/trinity-large-preview:free",
            temperature: 0.1,
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const result = response.choices[0].message.content.trim();

        return {
            result,
            format: rowCount === 1 ? 'text' : 'markdown'
        };
    } catch (error) {
        console.error('Formatting error:', error);
    }
}

function buildFormattingPrompt(data, rowCount, userQuestion) {
    const sampleData = rowCount > 10 ? data.slice(0, 10) : data;

    return `You are an assistant that presents data in a web-friendly, easy-to-read format.

USER QUESTION: "${userQuestion}"
TOTAL DATA: ${rowCount} rows
DATA: ${JSON.stringify(sampleData, null, 2)}

TASK:
${rowCount === 1
            ? '- Since there is only 1 row, write 1–2 natural sentences in Indonesian that answer the question'
            : `- Since there are ${rowCount} rows, present the result in Markdown Table format
- Start with 1 summary sentence in Indonesian, then the table`
        }

OUTPUT FORMAT:
${rowCount === 1
            ? `Example for 1 row:
Total orders today are **145 orders**.

RULES:
- Answer directly without introductions like "Based on the data..."
- Use **bold** to highlight important numbers
- Maximum 2 sentences`
            : `Example for multiple rows:
Found **${rowCount} products** with the highest sales this month:

| Product | Variant | Total Sold |
|----------|----------|-------------|
| Plain T-Shirt | Black M | 523 |
| Flannel Shirt | Blue Checkered L | 445 |

RULES:
- Start with 1 summary sentence
- Use proper Markdown table format
- Table headers must be clear (capitalized, no underscores)
- Numbers > 1000 must use dot format (1.234)
- If there are more than 10 rows, show only the top 10 and write "...and ${rowCount - 10} others" at the end`
        }

Now format the data above:`;
}
