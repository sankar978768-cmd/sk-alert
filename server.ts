import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on server side only if real key provided
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback rule-based parser in case API key is absent or network fails
function fallbackRuleBasedParser(text: string) {
  const alarms: any[] = [];
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  // Common timezones mapping
  const tzMap: Record<string, { id: string; label: string }> = {
    kathmandu: { id: 'Asia/Kathmandu', label: 'Kathmandu (NPT)' },
    nepal: { id: 'Asia/Kathmandu', label: 'Kathmandu (NPT)' },
    npt: { id: 'Asia/Kathmandu', label: 'Kathmandu (NPT)' },
    pst: { id: 'America/Los_Angeles', label: 'San Francisco (PT)' },
    pdt: { id: 'America/Los_Angeles', label: 'San Francisco (PT)' },
    pt: { id: 'America/Los_Angeles', label: 'San Francisco (PT)' },
    pacific: { id: 'America/Los_Angeles', label: 'San Francisco (PT)' },
    est: { id: 'America/New_York', label: 'New York (ET)' },
    edt: { id: 'America/New_York', label: 'New York (ET)' },
    et: { id: 'America/New_York', label: 'New York (ET)' },
    eastern: { id: 'America/New_York', label: 'New York (ET)' },
    cst: { id: 'America/Chicago', label: 'Chicago (CT)' },
    cdt: { id: 'America/Chicago', label: 'Chicago (CT)' },
    ct: { id: 'America/Chicago', label: 'Chicago (CT)' },
    gmt: { id: 'Europe/London', label: 'London (GMT)' },
    bst: { id: 'Europe/London', label: 'London (BST)' },
    london: { id: 'Europe/London', label: 'London (GMT/BST)' },
    cet: { id: 'Europe/Paris', label: 'Paris / Berlin (CET)' },
    cest: { id: 'Europe/Paris', label: 'Paris / Berlin (CET)' },
    paris: { id: 'Europe/Paris', label: 'Paris (CET)' },
    berlin: { id: 'Europe/Paris', label: 'Berlin (CET)' },
    jst: { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    tokyo: { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    japan: { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    sgt: { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
    singapore: { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
    gst: { id: 'Asia/Dubai', label: 'Dubai (GST)' },
    dubai: { id: 'Asia/Dubai', label: 'Dubai (GST)' },
    aest: { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
    aedt: { id: 'Australia/Sydney', label: 'Sydney (AEDT)' },
    sydney: { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
    australia: { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
    nzst: { id: 'Pacific/Auckland', label: 'Auckland (NZST)' },
    auckland: { id: 'Pacific/Auckland', label: 'Auckland (NZST)' },
    utc: { id: 'UTC', label: 'Universal Time (UTC)' },
  };

  // Check if text has header timezone e.g. "Asia/Kathmandu"
  let defaultTz = { id: 'America/Los_Angeles', label: 'San Francisco (PT)' };
  if (/kathmandu|nepal|asia\/kathmandu/i.test(text)) {
    defaultTz = { id: 'Asia/Kathmandu', label: 'Kathmandu (NPT)' };
  }

  // Check header date e.g. "2026-11-06 to 2026-11-06"
  let defaultDate: string | undefined = undefined;
  const headerDate = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (headerDate) {
    defaultDate = headerDate[1];
  }

  // Check match label e.g. "Match: CSK vs MI" or "IND vs NZ"
  let defaultMatchLabel: string | undefined = undefined;
  const matchHeader = text.match(/(?:match|game):\s*([^\r\n]+)/i);
  if (matchHeader) {
    defaultMatchLabel = matchHeader[1].trim();
  } else {
    const vsHeader = text.match(/\b([A-Za-z0-9&.]{2,15}\s+(?:vs\.?|v)\s+[A-Za-z0-9&.]{2,15})\b/i);
    if (vsHeader) {
      defaultMatchLabel = vsHeader[1].trim().replace(/\b([a-z]{2,4})\b/g, m => m.toUpperCase());
    }
  }

  // Check custom lead seconds e.g. "30s before", "15 sec early"
  let defaultLeadSeconds = 0;
  const secMatch = text.match(/(\d+)\s*(?:s|sec|seconds?)\s*(?:before|prior|early|advance)/i)
    || text.match(/(?:before|prior|early|advance)\s*(?:by)?\s*(\d+)\s*(?:s|sec|seconds?)/i);
  if (secMatch) {
    defaultLeadSeconds = parseInt(secMatch[1], 10);
  }

  for (const line of lines) {
    if (line.toLowerCase().startsWith('cricket wicket possibility') && line.includes('(')) {
      continue;
    }

    // Check date on line: "6 Nov 2026" or "2026-11-06"
    let lineDate = defaultDate;
    const dateMatch = line.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
    if (dateMatch) {
      const monthMap: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      const mNum = monthMap[dateMatch[2].toLowerCase().slice(0, 3)];
      if (mNum) {
        lineDate = `${dateMatch[3]}-${String(mNum).padStart(2, '0')}-${String(parseInt(dateMatch[1], 10)).padStart(2, '0')}`;
      }
    }

    // Check for range with seconds: "09:32:23 – 09:42:13 WICKET POSSIBILITY"
    const rangeSecMatch = line.match(/(\b\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?\s*[\u2013\u2014\-~to]+\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i);
    if (rangeSecMatch) {
      let hour = parseInt(rangeSecMatch[1], 10);
      const minute = parseInt(rangeSecMatch[2], 10);
      const second = parseInt(rangeSecMatch[3], 10);
      const mer = rangeSecMatch[4]?.toLowerCase();
      if (mer === 'pm' && hour < 12) hour += 12;
      if (mer === 'am' && hour === 12) hour = 0;

      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      const title = line.replace(rangeSecMatch[0], '').replace(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/, '').trim();

      alarms.push({
        title: title || 'Wicket Possibility',
        sourceTime: timeStr,
        sourceTimeZone: defaultTz.id,
        sourceCityLabel: defaultTz.label,
        recurrence: 'once',
        sourceDate: lineDate,
        leadTimeMinutes: Math.floor(defaultLeadSeconds / 60),
        leadTimeSeconds: defaultLeadSeconds,
        matchLabel: defaultMatchLabel,
        notes: `Possibility Window: ${rangeSecMatch[0]} (${defaultTz.label})`,
        category: 'sports'
      });
      continue;
    }

    // Check standard time
    const timeMatch = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(pst|pdt|pt|est|edt|et|cst|cdt|ct|gmt|bst|london|cet|cest|paris|berlin|jst|tokyo|sgt|singapore|gst|dubai|aest|aedt|sydney|kathmandu|npt|utc)?\b/i.exec(line);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();
      const tzKey = timeMatch[4]?.toLowerCase();

      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      const tzInfo = (tzKey && tzMap[tzKey]) ? tzMap[tzKey] : defaultTz;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      let recurrence = lineDate ? 'once' : 'weekdays';
      const lower = line.toLowerCase();
      if (lower.includes('daily') || lower.includes('every day')) recurrence = 'daily';

      const isSports = /wicket|cricket|advert|break|match|sports/i.test(line);
      const isMarket = /market|stock|nyse|trade/i.test(line);

      alarms.push({
        title: line.replace(timeMatch[0], '').trim() || `${tzInfo.label} Alarm`,
        sourceTime: timeStr,
        sourceTimeZone: tzInfo.id,
        sourceCityLabel: tzInfo.label,
        recurrence,
        sourceDate: lineDate,
        leadTimeMinutes: Math.floor(defaultLeadSeconds / 60),
        leadTimeSeconds: defaultLeadSeconds,
        matchLabel: defaultMatchLabel,
        notes: line,
        category: isSports ? 'sports' : isMarket ? 'market' : 'meeting'
      });
    }
  }

  return alarms;
}

// API endpoint to parse text into structured alarm times
app.post('/api/parse-text-alarms', async (req, res) => {
  const { text, location } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Please provide non-empty text to generate alarms from.' });
  }

  // If Gemini API is available, use it for intelligent semantic extraction
  if (ai) {
    try {
      const locationClause = location ? `\nSpecified Location context: "${location}". All times should be interpreted in the timezone of this location unless specified otherwise.` : '';
      const prompt = `You are an expert global time and alarm scheduler.
Extract all events, meetings, webinars, sports events (e.g. cricket wicket possibilities, advert breaks), or alarms mentioned in the following text.
${locationClause}
For each event:
1. Identify the event title (clean, concise name, e.g. "Wicket Possibility" or "Sprint Standup").
2. Extract the source start time in 24-hour format (HH:mm or HH:mm:ss if seconds are present).
3. Identify the source timezone and map it to an exact standard IANA timezone identifier (e.g. "Asia/Kathmandu" for Nepal/Kathmandu, "America/Los_Angeles" for Seattle/PT, "America/New_York" for ET, "Europe/London" for GMT/BST, etc.).
4. Provide a friendly sourceCityLabel (e.g. "Kathmandu (NPT)", "Seattle (PT)", "London (GMT/BST)").
5. Determine recurrence: 'once', 'daily', 'weekdays', or 'custom'. If a specific date like "6 Nov 2026" or "2026-11-06" is mentioned, recurrence is 'once'.
6. If a specific date is mentioned (e.g., "6 Nov 2026", "2026-11-06", "Nov 12"), resolve to ISO date string 'YYYY-MM-DD'.
7. If custom days are specified, supply customDays array of integers (0=Sun, ..., 6=Sat).
8. Determine advance alert notice in seconds (e.g. 0 for exact, 10, 15, 30, 60 seconds).
9. Classify category: 'sports', 'meeting', 'work', 'market', 'webinar', 'personal', or 'custom'. Cricket and match events must be 'sports'.
10. If a match or game is mentioned (e.g. "CSK vs MI", "IND vs NZ", "Cricket Wicket Possibility"), identify the matchLabel string.
11. Include a brief notes string summarizing context (e.g. time range window).

Current date reference: ${new Date().toISOString().slice(0, 10)}.

Input text:
"""
${text}
"""`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You extract and normalize scheduling and alarm times from natural text into structured JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of alarms extracted from text',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Descriptive title of the alarm' },
                sourceTime: { type: Type.STRING, description: 'Time in HH:mm or HH:mm:ss 24-hour format' },
                sourceTimeZone: { type: Type.STRING, description: 'Standard IANA timezone string' },
                sourceCityLabel: { type: Type.STRING, description: 'Friendly city and timezone abbreviation' },
                recurrence: { type: Type.STRING, description: 'once, daily, weekdays, or custom' },
                sourceDate: { type: Type.STRING, description: 'Optional YYYY-MM-DD date' },
                customDays: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: 'Days of week 0-6'
                },
                leadTimeMinutes: { type: Type.INTEGER, description: '0, 5, 10, 15, or 30' },
                leadTimeSeconds: { type: Type.INTEGER, description: 'Advance notice in seconds, default 0' },
                matchLabel: { type: Type.STRING, description: 'Match or series identifier if applicable, e.g. CSK vs MI or IND vs NZ' },
                category: { type: Type.STRING, description: 'sports, meeting, work, market, webinar, personal, custom' },
                notes: { type: Type.STRING, description: 'Original context snippet' }
              },
              required: ['title', 'sourceTime', 'sourceTimeZone', 'sourceCityLabel', 'recurrence', 'leadTimeMinutes']
            }
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Inference deadline timeout')), 4000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const parsedAlarms = JSON.parse(response.text || '[]');
      return res.json({ alarms: parsedAlarms, method: 'gemini' });
    } catch {
      // Clean fallback to rule-based parser
    }
  }

  // Fallback to robust regex parser
  const fallbackResults = fallbackRuleBasedParser(text);
  return res.json({ alarms: fallbackResults, method: 'heuristic' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChronosIST server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
