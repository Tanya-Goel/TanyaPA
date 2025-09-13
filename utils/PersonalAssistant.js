// utils/PersonalAssistant.js
class PersonalAssistant {
  constructor() {
    this.logPatterns = [
      /log\s+(?:that\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
      /i\s+(?:woke\s+up|got\s+up|started|did|completed|finished)\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?)?\s*(.+)/i,
      /add\s+to\s+log\s*:?\s*(.+)/i,
      /record\s+(?:that\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
    ];
    
    this.reminderPatterns = [
      /remind\s+me\s+(?:to\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
      /set\s+a\s+reminder\s+(?:to\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
      /reminder\s*:?\s*(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
      /don't\s+forget\s+(?:to\s+)?(.+?)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
    ];
    
    this.queryPatterns = [
      /what\s+(?:did\s+i\s+)?log\s+today/i,
      /show\s+me\s+my\s+logs\s+for\s+today/i,
      /what\s+are\s+my\s+reminders\s+(?:for\s+today)?/i,
      /show\s+me\s+my\s+reminders/i,
      /what\s+do\s+i\s+have\s+scheduled\s+today/i,
      /what's\s+on\s+my\s+schedule\s+today/i,
      /tell\s+me\s+about\s+my\s+day/i,
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
    
    // Check for reminder patterns
    for (const pattern of this.reminderPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        return {
          type: 'reminder',
          text: match[1],
          time: match[2] || this.extractTime(input) || 'no specific time',
          originalInput: input
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
        return `🔔 Reminder set! I'll remind you to "${parsedInput.text}" at ${parsedInput.time}.`;
      
      case 'query':
        return this.generateQueryResponse(parsedInput.queryType, data);
      
      default:
        return `🤔 I'm not sure what you mean. Try saying something like "Log that I woke up at 7:30 AM" or "Remind me to call mom at 9 PM".`;
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
