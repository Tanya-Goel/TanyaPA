// Parse natural language time expressions into Date objects
export const parseTimeExpression = (input: string): Date | null => {
  const now = new Date();
  const lowercaseInput = input.toLowerCase().trim();
  
  console.log('Parsing time expression:', lowercaseInput);

  // Comprehensive time patterns
  const timePatterns = [
    // Relative time: "in X minutes/hours/days/weeks"
    {
      pattern: /in (\d+) ?(minutes?|mins?|hours?|hrs?|days?|weeks?|seconds?|secs?)/i,
      parse: (match: RegExpMatchArray) => {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        console.log('Matched relative time:', value, unit);
        
        if (unit.startsWith('sec')) {
          return new Date(now.getTime() + value * 1000);
        } else if (unit.startsWith('min')) {
          return new Date(now.getTime() + value * 60 * 1000);
        } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
          return new Date(now.getTime() + value * 60 * 60 * 1000);
        } else if (unit.startsWith('day')) {
          return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        } else if (unit.startsWith('week')) {
          return new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
        }
        return null;
      }
    },
    
    // Specific times: "at 3pm", "at 15:30", "at 9am", "at 3:30pm"
    {
      pattern: /at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i,
      parse: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2] || '0');
        const ampm = match[3]?.toLowerCase();

        console.log('Matched specific time:', hour, minute, ampm);

        if (ampm === 'pm' && hour !== 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        const result = new Date(now);
        result.setHours(hour, minute, 0, 0);
        
        // If the time has passed today, set for tomorrow
        if (result <= now) {
          result.setDate(result.getDate() + 1);
        }
        
        return result;
      }
    },
    
    // Tomorrow with time: "tomorrow at 9am", "tomorrow at 3:30pm"
    {
      pattern: /tomorrow at (\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i,
      parse: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2] || '0');
        const ampm = match[3]?.toLowerCase();

        console.log('Matched tomorrow with time:', hour, minute, ampm);

        if (ampm === 'pm' && hour !== 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        const result = new Date(now);
        result.setDate(result.getDate() + 1);
        result.setHours(hour, minute, 0, 0);
        
        return result;
      }
    },
    
    // Specific dates: "on December 25", "on Dec 25", "on 12/25", "on 25/12"
    {
      pattern: /on (\w+) (\d{1,2})(?:st|nd|rd|th)?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i,
      parse: (match: RegExpMatchArray) => {
        const month = match[1];
        const day = parseInt(match[2]);
        const hour = match[3] ? parseInt(match[3]) : 9;
        const minute = match[4] ? parseInt(match[4]) : 0;
        const ampm = match[5]?.toLowerCase();

        console.log('Matched specific date:', month, day, hour, minute, ampm);

        const months = {
          january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
          april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
          august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9,
          november: 10, nov: 10, december: 11, dec: 11
        };

        const monthNum = months[month.toLowerCase() as keyof typeof months];
        if (monthNum === undefined) return null;

        let adjustedHour = hour;
        if (ampm === 'pm' && hour !== 12) adjustedHour += 12;
        if (ampm === 'am' && hour === 12) adjustedHour = 0;

        const result = new Date(now.getFullYear(), monthNum, day, adjustedHour, minute, 0, 0);
        
        // If the date has passed this year, set for next year
        if (result <= now) {
          result.setFullYear(result.getFullYear() + 1);
        }
        
        return result;
      }
    },
    
    // Numeric dates: "on 12/25", "on 25/12", "on 2024-12-25"
    {
      pattern: /on (\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i,
      parse: (match: RegExpMatchArray) => {
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : now.getFullYear();
        const hour = match[4] ? parseInt(match[4]) : 9;
        const minute = match[5] ? parseInt(match[5]) : 0;
        const ampm = match[6]?.toLowerCase();

        console.log('Matched numeric date:', first, second, year, hour, minute, ampm);

        let adjustedHour = hour;
        if (ampm === 'pm' && hour !== 12) adjustedHour += 12;
        if (ampm === 'am' && hour === 12) adjustedHour = 0;

        // Assume MM/DD format for US style, DD/MM for others
        const month = first <= 12 ? first - 1 : second - 1;
        const day = first <= 12 ? second : first;

        const result = new Date(year < 100 ? 2000 + year : year, month, day, adjustedHour, minute, 0, 0);
        
        if (result <= now) {
          result.setFullYear(result.getFullYear() + 1);
        }
        
        return result;
      }
    },
    
    // Days of the week: "next monday", "this friday", "monday at 2pm"
    {
      pattern: /(next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s?(am|pm)?)?/i,
      parse: (match: RegExpMatchArray) => {
        const modifier = match[1]?.toLowerCase();
        const dayName = match[2].toLowerCase();
        const hour = match[3] ? parseInt(match[3]) : 9;
        const minute = match[4] ? parseInt(match[4]) : 0;
        const ampm = match[5]?.toLowerCase();

        console.log('Matched day of week:', modifier, dayName, hour, minute, ampm);

        const days = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
          thursday: 4, friday: 5, saturday: 6
        };

        const targetDay = days[dayName as keyof typeof days];
        const currentDay = now.getDay();

        let adjustedHour = hour;
        if (ampm === 'pm' && hour !== 12) adjustedHour += 12;
        if (ampm === 'am' && hour === 12) adjustedHour = 0;

        const result = new Date(now);
        let daysToAdd = targetDay - currentDay;

        if (modifier === 'next' || daysToAdd <= 0) {
          daysToAdd += 7;
        }

        result.setDate(result.getDate() + daysToAdd);
        result.setHours(adjustedHour, minute, 0, 0);

        return result;
      }
    },
    
    // Tomorrow (default to 9am)
    {
      pattern: /tomorrow/i,
      parse: () => {
        console.log('Matched tomorrow');
        const result = new Date(now);
        result.setDate(result.getDate() + 1);
        result.setHours(9, 0, 0, 0);
        return result;
      }
    },
    
    // Later today/later
    {
      pattern: /(later today|later)/i,
      parse: () => {
        console.log('Matched later');
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      }
    },
    
    // Now/right now
    {
      pattern: /(right )?now/i,
      parse: () => {
        console.log('Matched now');
        return new Date(now.getTime() + 30 * 1000); // 30 seconds from now
      }
    }
  ];

  for (const { pattern, parse } of timePatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      const result = parse(match);
      console.log('Parsed time result:', result);
      return result;
    }
  }

  console.log('No time pattern matched');
  return null;
};

export const formatTimeUntil = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Overdue';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  return 'Due now';
};