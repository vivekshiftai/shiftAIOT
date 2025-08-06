import { supabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notificationService';
import { deviceService } from './deviceService';

export interface Rule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  organization_id: string;
  created_at: string;
  updated_at: string;
  last_triggered?: string;
}

export interface RuleCondition {
  id: string;
  type: 'device_status' | 'telemetry_threshold' | 'time_based';
  device_id?: string;
  metric?: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: string | number;
  logic_operator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'notification' | 'device_control' | 'webhook' | 'log';
  config: Record<string, any>;
}

export class RuleService {
  async createRule(ruleData: Partial<Rule>, organizationId: string): Promise<Rule> {
    const rule = {
      id: uuidv4(),
      ...ruleData,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('rules')
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRules(organizationId: string): Promise<Rule[]> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRule(ruleId: string, organizationId: string): Promise<Rule | null> {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('id', ruleId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async updateRule(ruleId: string, updates: Partial<Rule>, organizationId: string): Promise<Rule> {
    const { data, error } = await supabase
      .from('rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRule(ruleId: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', ruleId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  async evaluateRules(deviceId: string, telemetryData: any): Promise<void> {
    // Get device info
    const device = await deviceService.getDevice(deviceId, telemetryData.organization_id);
    if (!device) return;

    // Get active rules for this organization
    const rules = await this.getRules(device.organization_id);
    const activeRules = rules.filter(rule => rule.active);

    for (const rule of activeRules) {
      const shouldTrigger = await this.evaluateRuleConditions(rule, device, telemetryData);
      
      if (shouldTrigger) {
        await this.executeRuleActions(rule, device, telemetryData);
        
        // Update last triggered timestamp
        await this.updateRule(rule.id, {
          last_triggered: new Date().toISOString()
        }, device.organization_id);
      }
    }
  }

  private async evaluateRuleConditions(rule: Rule, device: any, telemetryData: any): Promise<boolean> {
    const results: boolean[] = [];

    for (const condition of rule.conditions) {
      let result = false;

      switch (condition.type) {
        case 'device_status':
          result = this.evaluateStatusCondition(condition, device);
          break;
        case 'telemetry_threshold':
          result = this.evaluateTelemetryCondition(condition, telemetryData);
          break;
        case 'time_based':
          result = this.evaluateTimeCondition(condition);
          break;
      }

      results.push(result);
    }

    // Evaluate logic operators (simplified - assumes all AND for now)
    return results.every(result => result);
  }

  private evaluateStatusCondition(condition: RuleCondition, device: any): boolean {
    const deviceStatus = device.status;
    const expectedStatus = condition.value;

    switch (condition.operator) {
      case '=':
        return deviceStatus === expectedStatus;
      case '!=':
        return deviceStatus !== expectedStatus;
      default:
        return false;
    }
  }

  private evaluateTelemetryCondition(condition: RuleCondition, telemetryData: any): boolean {
    if (!condition.metric || !telemetryData.metrics) return false;

    const actualValue = telemetryData.metrics[condition.metric];
    const expectedValue = parseFloat(condition.value.toString());

    if (actualValue === undefined || isNaN(expectedValue)) return false;

    switch (condition.operator) {
      case '>':
        return actualValue > expectedValue;
      case '<':
        return actualValue < expectedValue;
      case '=':
        return actualValue === expectedValue;
      case '>=':
        return actualValue >= expectedValue;
      case '<=':
        return actualValue <= expectedValue;
      default:
        return false;
    }
  }

  private evaluateTimeCondition(condition: RuleCondition): boolean {
    // Simplified time-based evaluation
    const now = new Date();
    const hour = now.getHours();
    
    // Example: trigger between 9 AM and 5 PM
    return hour >= 9 && hour <= 17;
  }

  private async executeRuleActions(rule: Rule, device: any, telemetryData: any): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'notification':
            await this.executeNotificationAction(action, rule, device, telemetryData);
            break;
          case 'device_control':
            await this.executeDeviceControlAction(action, device);
            break;
          case 'webhook':
            await this.executeWebhookAction(action, rule, device, telemetryData);
            break;
          case 'log':
            await this.executeLogAction(action, rule, device, telemetryData);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type} for rule ${rule.id}:`, error);
      }
    }
  }

  private async executeNotificationAction(action: RuleAction, rule: Rule, device: any, telemetryData: any): Promise<void> {
    const notification = {
      title: `Rule Triggered: ${rule.name}`,
      message: `Device ${device.name} has triggered rule "${rule.name}". Current status: ${device.status}`,
      type: 'warning' as const,
      device_id: device.id,
      rule_id: rule.id,
      organization_id: device.organization_id
    };

    await notificationService.createNotification(notification);

    // Send to configured channels
    if (action.config.channels) {
      for (const channel of action.config.channels) {
        await notificationService.sendNotification(notification, channel);
      }
    }
  }

  private async executeDeviceControlAction(action: RuleAction, device: any): Promise<void> {
    // Implement device control logic
    console.log(`Executing device control action for device ${device.id}:`, action.config);
  }

  private async executeWebhookAction(action: RuleAction, rule: Rule, device: any, telemetryData: any): Promise<void> {
    // Implement webhook execution
    const payload = {
      rule: rule.name,
      device: device.name,
      telemetry: telemetryData,
      timestamp: new Date().toISOString()
    };

    console.log(`Executing webhook action:`, payload);
  }

  private async executeLogAction(action: RuleAction, rule: Rule, device: any, telemetryData: any): Promise<void> {
    // Log the rule execution
    console.log(`Rule ${rule.name} triggered for device ${device.name}:`, {
      rule: rule.id,
      device: device.id,
      telemetry: telemetryData,
      timestamp: new Date().toISOString()
    });
  }
}

export const ruleService = new RuleService();