import { supabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import axios from 'axios';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  device_id?: string;
  rule_id?: string;
  user_id?: string;
  organization_id: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = {
      id: uuidv4(),
      ...notificationData,
      read: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotifications(organizationId: string, userId?: string): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId);

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async markAsRead(notificationId: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  }

  async markAllAsRead(organizationId: string, userId?: string): Promise<void> {
    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('organization_id', organizationId);

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async sendNotification(notification: Notification, channel: string): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'slack':
        await this.sendSlackNotification(notification);
        break;
      case 'teams':
        await this.sendTeamsNotification(notification);
        break;
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!process.env.EMAIL_USER) {
      console.warn('Email notifications not configured');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@iot-platform.com',
      subject: `IoT Alert: ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin: 0 0 16px 0;">${notification.title}</h2>
            <p style="color: #666; margin: 0 0 16px 0;">${notification.message}</p>
            <div style="background: white; padding: 16px; border-radius: 4px; border-left: 4px solid #007bff;">
              <strong>Type:</strong> ${notification.type}<br>
              <strong>Time:</strong> ${new Date(notification.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email notification sent for: ${notification.title}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendSlackNotification(notification: Notification): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('Slack webhook not configured');
      return;
    }

    const payload = {
      text: notification.title,
      attachments: [
        {
          color: this.getSlackColor(notification.type),
          fields: [
            {
              title: 'Message',
              value: notification.message,
              short: false
            },
            {
              title: 'Type',
              value: notification.type,
              short: true
            },
            {
              title: 'Time',
              value: new Date(notification.created_at).toLocaleString(),
              short: true
            }
          ]
        }
      ]
    };

    try {
      await axios.post(webhookUrl, payload);
      console.log(`Slack notification sent for: ${notification.title}`);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private async sendTeamsNotification(notification: Notification): Promise<void> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('Teams webhook not configured');
      return;
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getTeamsColor(notification.type),
      summary: notification.title,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: notification.message,
          facts: [
            {
              name: 'Type',
              value: notification.type
            },
            {
              name: 'Time',
              value: new Date(notification.created_at).toLocaleString()
            }
          ]
        }
      ]
    };

    try {
      await axios.post(webhookUrl, payload);
      console.log(`Teams notification sent for: ${notification.title}`);
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
    }
  }

  private getSlackColor(type: string): string {
    switch (type) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'good';
      default:
        return '#007bff';
    }
  }

  private getTeamsColor(type: string): string {
    switch (type) {
      case 'error':
        return 'FF0000';
      case 'warning':
        return 'FFA500';
      case 'success':
        return '00FF00';
      default:
        return '007bff';
    }
  }
}

export const notificationService = new NotificationService();