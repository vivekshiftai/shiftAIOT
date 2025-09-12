/**
 * Simple and robust SSE parser for handling Server-Sent Events
 */

export interface SSEEvent {
  type: string;
  data: any;
}

export class SSEParser {
  private buffer: string = '';
  private currentEvent: string = '';
  private currentData: string = '';

  /**
   * Parse SSE events from a chunk of data
   */
  parseChunk(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const events: SSEEvent[] = [];
    
    // Split by lines and keep incomplete line in buffer
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('event: ')) {
        this.currentEvent = trimmedLine.substring(7).trim();
        console.log('🌐 SSE Parser: Event type received', { event: this.currentEvent });
      } else if (trimmedLine.startsWith('data: ')) {
        this.currentData = trimmedLine.substring(6);
        console.log('🌐 SSE Parser: Data received', { 
          dataLength: this.currentData.length,
          dataPreview: this.currentData.substring(0, Math.min(100, this.currentData.length)) + '...'
        });
      } else if (trimmedLine === '') {
        // Empty line indicates end of event
        if (this.currentEvent && this.currentData) {
          console.log('🌐 SSE Parser: Processing complete event', { 
            event: this.currentEvent, 
            dataLength: this.currentData.length 
          });
          
          try {
            const eventData = JSON.parse(this.currentData);
            events.push({
              type: this.currentEvent,
              data: eventData
            });
            console.log('🌐 SSE Parser: Event added to queue', { 
              type: this.currentEvent, 
              dataKeys: Object.keys(eventData) 
            });
          } catch (parseError) {
            console.error('🌐 SSE Parser: Failed to parse event data', { 
              event: this.currentEvent, 
              data: this.currentData, 
              error: parseError 
            });
          }
        }
        
        // Reset for next event
        this.currentEvent = '';
        this.currentData = '';
      }
    }
    
    return events;
  }

  /**
   * Get remaining buffer (incomplete line)
   */
  getRemainingBuffer(): string {
    return this.buffer;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = '';
    this.currentEvent = '';
    this.currentData = '';
  }
}
