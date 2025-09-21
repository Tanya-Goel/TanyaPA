// utils/PersonalAssistant.js - Enhanced with sophisticated time parsing

// Utility function for consistent date handling
const createDate = (year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) => {
  const date = new Date(year, month, day, hour, minute, second, millisecond);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date created, using current time');
    return new Date();
  }
  return date;
};

class PersonalAssistant {
  constructor() {
    this.logPatterns = [
      /log\s+(?:that\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?$/i,
      /i\s+(?:woke\s+up|got\s+up|started|did|completed|finished)\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?)?\s*(.+)/i,
      /add\s+to\s+log\s*:?\s*(.+)/i,
      /record\s+(?:that\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
    ];
    
    this.reminderPatterns = [
      // More specific patterns that don't capture time information
      /remind\s+me\s+(?:to\s+)?(?!.*\b(?:in|at|minutes?|seconds?|hours?|mins?|secs?|hrs?)\b)(.+)/i,
      /set\s+a\s+reminder\s+(?:to\s+)?(?!.*\b(?:in|at|minutes?|seconds?|hours?|mins?|secs?|hrs?)\b)(.+)/i,
      /reminder\s*:?\s*(?!.*\b(?:in|at|minutes?|seconds?|hours?|mins?|secs?|hrs?)\b)(.+)/i,
      /don't\s+forget\s+(?:to\s+)?(?!.*\b(?:in|at|minutes?|seconds?|hours?|mins?|secs?|hrs?)\b)(.+)/i,
    ];
    
    this.queryPatterns = [
      /what\s+(?:did\s+i\s+)?log\s+today/i,
      /show\s+me\s+my\s+logs\s+for\s+today/i,
      /what\s+are\s+my\s+reminders\s+(?:for\s+today)?/i,
      /show\s+me\s+my\s+reminders/i,
      /what\s+do\s+i\s+have\s+scheduled\s+today/i,
      /what's\s+on\s+my\s+schedule\s+today/i,
      /tell\s+me\s+about\s+my\s+day/i,
      /stats?|summary/i,
    ];
  }

  parseInput(input) {
    const lowerInput = input.toLowerCase().trim();
    
    // Check for log patterns
    for (const pattern of this.logPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        return {
          type: 'log',
          action: match[1] || match[3] || 'activity',
          time: match[2] || this.extractTime(input) || 'unknown time',
          originalInput: input
        };
      }
    }
    
    // Check for time-based reminder patterns first (e.g., "remind me in X seconds to task")
    const timeBasedReminderPatterns = [
      /remind\s+me\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?|hours?|hrs?)\s+to\s+(.+)/i,
      /remind\s+me\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?|hours?|hrs?)\s+(.+)/i,
      /remind\s+me\s+to\s+(.+?)\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?|hours?|hrs?)/i,
      /in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?|hours?|hrs?)\s+to\s+(.+)/i,
      /in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?|hours?|hrs?)\s+(.+)/i,
    ];
    
    // Check for specific time reminder patterns (e.g., "remind me today at 2:00 PM to task")
    const specificTimeReminderPatterns = [
      /remind\s+me\s+(?:today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s+to\s+(.+)/i,
      /remind\s+me\s+(?:today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s+(.+)/i,
      /remind\s+me\s+to\s+(.+?)\s+(?:today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
    ];
    
    for (const pattern of timeBasedReminderPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        let amount, unit, task;
        
        // Handle different pattern formats
        if (pattern.source.includes('remind\\s+me\\s+to\\s+(.+?)\\s+in\\s+')) {
          // Pattern: "remind me to task in X minutes"
          task = match[1].trim();
          amount = parseInt(match[2]);
          unit = match[3].toLowerCase();
        } else {
          // Other patterns: "remind me in X minutes to task" or "in X minutes to task"
          amount = parseInt(match[1]);
          unit = match[2].toLowerCase();
          task = match[3] ? match[3].trim() : '';
        }
        
        const targetTime = new Date();
        if (unit.startsWith('minute') || unit.startsWith('min')) {
          targetTime.setMinutes(targetTime.getMinutes() + amount);
        } else if (unit.startsWith('second') || unit.startsWith('sec')) {
          targetTime.setSeconds(targetTime.getSeconds() + amount);
        } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
          targetTime.setHours(targetTime.getHours() + amount);
        }
        
        return {
          type: 'reminder',
          text: task,
          time: targetTime.toTimeString().slice(0, 8), // Include seconds: HH:MM:SS
          date: targetTime.toISOString().split('T')[0],
          dateWord: 'today',
          originalTime: `in ${amount} ${unit}`,
          datetime: targetTime,
          originalInput: input
        };
      }
    }
    
    // Check for specific time reminder patterns (e.g., "remind me today at 2:00 PM to task")
    for (const pattern of specificTimeReminderPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        let hours, minutes, ampm, task, dateWord;
        
        // Handle different pattern formats
        if (pattern.source.includes('remind\\s+me\\s+to\\s+(.+?)\\s+(?:today|tomorrow)?\\s*at\\s+')) {
          // Pattern: "remind me to task today at 2:00 PM"
          task = match[1].trim();
          hours = parseInt(match[2]);
          minutes = parseInt(match[3] || 0);
          ampm = match[4]?.toLowerCase();
        } else {
          // Other patterns: "remind me today at 2:00 PM to task"
          hours = parseInt(match[1]);
          minutes = parseInt(match[2] || 0);
          ampm = match[3]?.toLowerCase();
          task = match[4] ? match[4].trim() : '';
        }
        
        // Convert to 24-hour format
        if (ampm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        // Determine if it's today or tomorrow
        const now = new Date();
        const targetDate = new Date(now);
        
        // Check if the input contains "tomorrow"
        if (input.toLowerCase().includes('tomorrow')) {
          targetDate.setDate(now.getDate() + 1);
          dateWord = 'tomorrow';
        } else {
          dateWord = 'today';
        }
        
        // Create the target datetime
        const targetTime = createDate(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          hours,
          minutes,
          0,
          0
        );
        
        return {
          type: 'reminder',
          text: task,
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          date: targetTime.toISOString().split('T')[0],
          dateWord: dateWord,
          originalTime: `${hours}:${minutes.toString().padStart(2, '0')}${ampm ? ampm.toUpperCase() : ''}`,
          datetime: targetTime,
          originalInput: input
        };
      }
    }
    
    // Check for reminder patterns
    for (const pattern of this.reminderPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const parsedTime = this.parseTime(match[1]);
        return {
          type: 'reminder',
          text: parsedTime.task,
          time: parsedTime.time,
          date: parsedTime.date,
          dateWord: parsedTime.dateWord,
          originalTime: parsedTime.originalTime,
          originalInput: input,
          datetime: parsedTime.datetime // Include datetime field
        };
      }
    }
    
    // Check for query patterns
    for (const pattern of this.queryPatterns) {
      if (pattern.test(lowerInput)) {
        return {
          type: 'query',
          queryType: this.getQueryType(lowerInput),
          originalInput: input
        };
      }
    }
    
    return {
      type: 'unknown',
      originalInput: input
    };
  }

  // Enhanced time parsing from KeepCloneAssistant
  parseTime(text) {
    if (!text) {
      const today = new Date().toISOString().split('T')[0];
      return { time: null, date: today, task: text, dateWord: 'today' };
    }
    
    // Handle "in X minutes/seconds" format - comprehensive patterns (ordered by specificity)
    const timePatterns = [
      // Pattern 1: "task in X minutes/seconds" (most specific)
      /(.+?)\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)/i,
      /(.+?)\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)/i,
      
      // Pattern 2: "in X minutes/seconds to task"
      /in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)\s+to\s+(.+)/i,
      /in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)\s+(.+)/i,
      
      // Pattern 2b: "remind me in X minutes/seconds to task"
      /remind\s+me\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)\s+to\s+(.+)/i,
      
      // Pattern 2c: "remind me to task in X minutes/seconds"
      /remind\s+me\s+to\s+(.+?)\s+in\s+(\d+)\s+(minutes?|seconds?|mins?|secs?)/i,
      
      // Pattern 3: "X minutes/seconds to task"
      /(\d+)\s+(minutes?|seconds?|mins?|secs?)\s+to\s+(.+)/i,
      /(\d+)\s+(minutes?|seconds?|mins?|secs?)\s+(.+)/i,
      
      // Pattern 4: "in X hours to task" (for hours)
      /in\s+(\d+)\s+(hours?|hrs?)\s+to\s+(.+)/i,
      /in\s+(\d+)\s+(hours?|hrs?)\s+(.+)/i,
      
      // Pattern 5: "X hours to task"
      /(\d+)\s+(hours?|hrs?)\s+to\s+(.+)/i,
      /(\d+)\s+(hours?|hrs?)\s+(.+)/i
    ];
    
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount, unit, task;
        
        // Different patterns have different capture group orders
        if (pattern.source.includes('remind\\s+me\\s+to\\s+(.+?)\\s+in\\s+')) {
          // Pattern: "remind me to task in X minutes/seconds"
          task = match[1].trim();
          amount = parseInt(match[2]);
          unit = match[3].toLowerCase();
        } else if (pattern.source.includes('remind\\s+me\\s+in\\s+')) {
          // Pattern: "remind me in X minutes/seconds to task"
          amount = parseInt(match[1]);
          unit = match[2].toLowerCase();
          task = match[3] ? match[3].trim() : '';
        } else if (pattern.source.includes('(.+?)\\s+in\\s+')) {
          // Pattern: "task in X minutes/seconds"
          task = match[1].trim();
          amount = parseInt(match[2]);
          unit = match[3].toLowerCase();
        } else if (pattern.source.includes('(.+?)\\s+(\\d+)')) {
          // Pattern: "task X minutes/seconds"
          task = match[1].trim();
          amount = parseInt(match[2]);
          unit = match[3].toLowerCase();
        } else if (pattern.source.includes('in\\s+(\\d+)')) {
          // Pattern: "in X minutes/seconds/hours to task" or "in X minutes/seconds/hours task"
          amount = parseInt(match[1]);
          unit = match[2].toLowerCase();
          task = match[3] ? match[3].trim() : '';
        } else {
          // Pattern: "X minutes/seconds/hours to task" or "X minutes/seconds/hours task"
          amount = parseInt(match[1]);
          unit = match[2].toLowerCase();
          task = match[3] ? match[3].trim() : '';
        }
        
        const targetTime = new Date();
        
        if (unit.startsWith('minute') || unit.startsWith('min')) {
          targetTime.setMinutes(targetTime.getMinutes() + amount);
        } else if (unit.startsWith('second') || unit.startsWith('sec')) {
          targetTime.setSeconds(targetTime.getSeconds() + amount);
        } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
          targetTime.setHours(targetTime.getHours() + amount);
        }
        
        // Debug logging to check date creation
        
        // Ensure we have a valid date
        if (isNaN(targetTime.getTime())) {
          console.warn('Invalid target time created, using current time + 1 minute');
          targetTime.setTime(Date.now() + 60000); // 1 minute from now
        }
        
        return {
          time: targetTime.toTimeString().slice(0, 8), // Include seconds: HH:MM:SS
          date: targetTime.toISOString().split('T')[0],
          dateWord: 'today',
          task: task,
          originalTime: `in ${amount} ${unit}`,
          datetime: targetTime // Add datetime for new system
        };
      }
    }

    // Regular time parsing with date support
    const dateTimeRegex = /(today|tomorrow)?\s*at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const match = text.match(dateTimeRegex);
    
    if (match) {
      const dateWord = match[1]?.toLowerCase() || 'today';
      let hours = parseInt(match[2]);
      let minutes = parseInt(match[3] || 0);
      const ampm = match[4]?.toLowerCase();
      
      if (ampm === 'pm' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
      
      if (!ampm && hours >= 1 && hours <= 11) {
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour >= 12) {
          hours += 12;
        }
      }
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const now = new Date();
      const targetDate = new Date(now);
      
      if (dateWord === 'tomorrow') {
        targetDate.setDate(now.getDate() + 1);
      }
      
      const dateString = targetDate.toISOString().split('T')[0];
      let taskText = text.replace(dateTimeRegex, '').trim();
      
      // Clean up common prefixes and suffixes
      taskText = taskText.replace(/^(remind\s+me\s+)?(to\s+)?/i, '').trim();
      taskText = taskText.replace(/\s+(to\s+)?$/i, '').trim();
      
      // Create datetime object for the reminder with proper timezone handling
      const reminderDateTime = createDate(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
      
      return { 
        time: timeString, 
        date: dateString,
        dateWord: dateWord,
        task: taskText,
        originalTime: `${match[2]}:${match[3] || '00'}${ampm ? ampm.toUpperCase() : ''}`,
        datetime: reminderDateTime // Add datetime for new system
      };
    }
    
    // Default to today's date if no specific time is parsed
    const today = new Date().toISOString().split('T')[0];
    return { time: null, date: today, task: text, dateWord: 'today' };
  }

  extractTime(input) {
    const timeMatch = input.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
    return timeMatch ? timeMatch[1] : null;
  }

  getQueryType(input) {
    if (/log/.test(input)) return 'logs';
    if (/reminder/.test(input)) return 'reminders';
    return 'both';
  }

  generateResponse(parsedInput, data = null) {
    switch (parsedInput.type) {
      case 'log':
        return `✅ Got it! I've logged "${parsedInput.action}" at ${parsedInput.time}.`;
      
      case 'reminder':
        // Silent response - reminder will appear in Reminders Folder
        return `Reminder added to your list`;
      
      case 'query':
        return this.generateQueryResponse(parsedInput.queryType, data);
      
      default:
        return `I can help you with:
• Log activities: "Log that I had breakfast"
• Set reminders: "Remind me at 6pm to call mom"
• Quick reminders: "Remind me in 5 minutes to check this"
• View data: "Show my logs" or "Show my reminders"
• Get stats: "Stats" or "Summary"`;
    }
  }

  generateQueryResponse(queryType, data) {
    if (!data || data.length === 0) {
      switch (queryType) {
        case 'logs':
          return "📝 You haven't logged anything today yet.";
        case 'reminders':
          return "🔔 You don't have any reminders set for today.";
        default:
          return "📋 You don't have any logs or reminders for today.";
      }
    }

    if (queryType === 'logs') {
      const logs = data.map(log => `• ${log.action} at ${log.time}`);
      return `📝 Here's what you've logged today:\n${logs.join('\n')}`;
    }
    
    if (queryType === 'reminders') {
      const reminders = data.map(reminder => `• ${reminder.text} at ${reminder.time}`);
      return `🔔 Here are your reminders for today:\n${reminders.join('\n')}`;
    }
    
    // Both logs and reminders
    const logs = data.logs || [];
    const reminders = data.reminders || [];
    
    let response = "";
    if (logs.length > 0) {
      response += `📝 Today's logs:\n${logs.map(log => `• ${log.action} at ${log.time}`).join('\n')}\n\n`;
    }
    if (reminders.length > 0) {
      response += `🔔 Today's reminders:\n${reminders.map(reminder => `• ${reminder.text} at ${reminder.time}`).join('\n')}`;
    }
    
    return response || "📋 You don't have any logs or reminders for today.";
  }
}

export default PersonalAssistant;
