import { addDays, setHours, setMinutes, format } from 'date-fns';
import type { TaskPriority, TransactionType } from '../../types';

export interface ParsedOmniResult {
  raw: string;
  type: 'task' | 'finance' | 'note';
  title: string;
  description?: string;
  // Task specific
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  category?: string;
  tags: string[];
  // Finance specific
  amount?: number;
  currency?: string;
  transactionType?: TransactionType;
  // Note specific
  content?: string;
}

export type OmniIntent = ParsedOmniResult;

export function parseOmniInput(input: string, defaultCurrency = 'INR'): ParsedOmniResult {
  const text = input.trim();
  if (!text) {
    return { raw: '', type: 'task', title: '', tags: [] };
  }

  // 1. Extract Tags (#tag)
  const tagMatches = text.match(/#([\w-]+)/g) || [];
  const tags = tagMatches.map((t) => t.substring(1).toLowerCase());
  let cleanText = text.replace(/#([\w-]+)/g, '').trim();

  // 2. Extract Priority (!urgent, !high, !med, !low)
  let priority: TaskPriority = 'medium';
  if (/!(urgent|p1)/i.test(cleanText) || /\burgent\b/i.test(cleanText)) {
    priority = 'urgent';
    cleanText = cleanText.replace(/!(urgent|p1)/gi, '').trim();
  } else if (/!(high|p2)/i.test(cleanText) || /\bhigh\s*priority\b/i.test(cleanText)) {
    priority = 'high';
    cleanText = cleanText.replace(/!(high|p2)/gi, '').trim();
  } else if (/!(low|p4)/i.test(cleanText) || /\blow\s*priority\b/i.test(cleanText)) {
    priority = 'low';
    cleanText = cleanText.replace(/!(low|p4)/gi, '').trim();
  } else if (/!(medium|p3)/i.test(cleanText)) {
    priority = 'medium';
    cleanText = cleanText.replace(/!(medium|p3)/gi, '').trim();
  }

  // 3. Check if it's Finance (Amount detection: ₹450, 450 Rs, $50, spent 300)
  const moneyMatch = cleanText.match(/(?:(?:rs\.?|inr|₹|\$|€|£)\s*(\d+(?:\.\d{1,2})?))|(?:(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹|\$|usd|eur|gbp))/i);
  const isFinanceIntent =
    Boolean(moneyMatch) ||
    /^(?:spent|paid|bought|received|earned|income|expense)\b/i.test(cleanText);

  if (isFinanceIntent && moneyMatch) {
    const rawVal = moneyMatch[1] || moneyMatch[2];
    const amount = parseFloat(rawVal);
    const isIncome = /^(?:received|earned|income|salary|got)\b/i.test(cleanText);
    const transType: TransactionType = isIncome ? 'income' : 'expense';

    // Determine category
    let cat = 'General';
    if (/\b(?:coffee|tea|food|dinner|lunch|breakfast|swiggy|zomato|starbucks|restaurant)\b/i.test(cleanText)) {
      cat = 'Food & Dining';
    } else if (/\b(?:uber|ola|cab|fuel|petrol|metro|flight|train|bus)\b/i.test(cleanText)) {
      cat = 'Transportation';
    } else if (/\b(?:groceries|market|supermarket|vegetables)\b/i.test(cleanText)) {
      cat = 'Groceries';
    } else if (/\b(?:movie|games|netflix|spotify|subscription)\b/i.test(cleanText)) {
      cat = 'Entertainment';
    } else if (/\b(?:salary|freelance|consulting|dividend)\b/i.test(cleanText)) {
      cat = 'Salary';
    }

    const title = cleanText
      .replace(moneyMatch[0], '')
      .replace(/^(?:spent|paid|bought|received|earned|expense|income)\s*(?:for|on|at)?/i, '')
      .trim() || `${cat} expense`;

    return {
      raw: text,
      type: 'finance',
      title,
      description: title,
      amount,
      currency: defaultCurrency,
      transactionType: transType,
      category: cat,
      tags,
    };
  }

  // 4. Check if it's Note intent (starts with note:, idea:, draft:)
  if (/^(?:note|idea|draft|memo)\s*[:\-]/i.test(cleanText)) {
    const titleAndContent = cleanText.replace(/^(?:note|idea|draft|memo)\s*[:\-]\s*/i, '');
    const firstLine = titleAndContent.split('\n')[0] || 'Quick Note';
    return {
      raw: text,
      type: 'note',
      title: firstLine,
      content: titleAndContent,
      tags,
    };
  }

  // 5. Default to Task: Extract Date and Time
  let dueDate: string | undefined = undefined;
  let dueTime: string | undefined = undefined;
  const now = new Date();

  // Date parsing
  if (/\btomorrow\b/i.test(cleanText)) {
    dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
    cleanText = cleanText.replace(/\btomorrow\b/gi, '').trim();
  } else if (/\btoday\b/i.test(cleanText) || /\btonight\b/i.test(cleanText)) {
    dueDate = format(now, 'yyyy-MM-dd');
    cleanText = cleanText.replace(/\b(today|tonight)\b/gi, '').trim();
  } else {
    const inDaysMatch = cleanText.match(/\bin\s*(\d+)\s*days?\b/i);
    if (inDaysMatch) {
      const daysToAdd = parseInt(inDaysMatch[1], 10);
      dueDate = format(addDays(now, daysToAdd), 'yyyy-MM-dd');
      cleanText = cleanText.replace(inDaysMatch[0], '').trim();
    }
  }

  // Time parsing (e.g. 5pm, 10:30am, 4:00, at 18:00)
  const timeMatch = cleanText.match(/(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch && (timeMatch[3] || timeMatch[0].startsWith('at ') || timeMatch[2])) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      cleanText = cleanText.replace(timeMatch[0], '').trim();
      if (!dueDate) {
        dueDate = format(now, 'yyyy-MM-dd');
      }
    }
  }

  // Clean remaining prepositions
  const taskTitle = cleanText
    .replace(/^(?:add\s+task:?|create\s+task:?|remind\s+(?:me\s+)?to|need\s+to|have\s+to|todo:?|task:?)\s*/i, '')
    .replace(/\s+(?:at|on|by)\s*$/i, '')
    .trim();

  // Category detection
  let taskCat = 'Personal';
  if (/\b(?:work|client|meeting|pr|code|bug|design|review|deploy|docs)\b/i.test(text)) {
    taskCat = 'Work';
  } else if (/\b(?:gym|workout|run|walk|exercise|health|doctor|water|pill)\b/i.test(text)) {
    taskCat = 'Health';
  } else if (/\b(?:read|study|course|learn|book|lecture)\b/i.test(text)) {
    taskCat = 'Learning';
  }

  return {
    raw: text,
    type: 'task',
    title: taskTitle || text,
    dueDate,
    dueTime,
    priority,
    category: taskCat,
    tags,
  };
}
