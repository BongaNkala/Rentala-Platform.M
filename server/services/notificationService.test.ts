import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateOverduePaymentEmail,
  generateUpcomingRentEmail,
  generateLeaseExpiringEmail,
  generateOverduePaymentSMS,
  generateUpcomingRentSMS,
  generateLeaseExpiringSMS,
} from './notificationService';

describe('Notification Service', () => {
  describe('Email Templates', () => {
    it('should generate overdue payment email with correct subject and content', () => {
      const email = generateOverduePaymentEmail({
        type: 'overdue_payment',
        recipientEmail: 'tenant@example.com',
        tenantName: 'John Doe',
        propertyName: 'Sunset Apartments',
        unitNumber: '4A',
        amount: 7500,
        daysOverdue: 15,
      });

      expect(email.subject).toContain('Overdue Rent Payment');
      expect(email.subject).toContain('Sunset Apartments');
      expect(email.body).toContain('John Doe');
      expect(email.body).toContain('R 7,500');
      expect(email.body).toContain('15 days');
    });

    it('should generate upcoming rent email with correct subject and content', () => {
      const email = generateUpcomingRentEmail({
        type: 'upcoming_rent',
        recipientEmail: 'tenant@example.com',
        tenantName: 'Jane Smith',
        propertyName: 'Downtown Complex',
        unitNumber: '7B',
        amount: 6200,
        daysUntilDue: 5,
      });

      expect(email.subject).toContain('Rent Due Soon');
      expect(email.body).toContain('Jane Smith');
      expect(email.body).toContain('R 6,200');
      expect(email.body).toContain('5 days');
    });

    it('should generate lease expiring email with correct subject and content', () => {
      const email = generateLeaseExpiringEmail({
        type: 'lease_expiring',
        recipientEmail: 'tenant@example.com',
        tenantName: 'Mike Johnson',
        propertyName: 'Garden Heights',
        unitNumber: '2C',
        daysUntilExpiry: 30,
      });

      expect(email.subject).toContain('Lease Expiration Notice');
      expect(email.body).toContain('Mike Johnson');
      expect(email.body).toContain('30 days');
    });
  });

  describe('SMS Templates', () => {
    it('should generate overdue payment SMS with correct format', () => {
      const sms = generateOverduePaymentSMS({
        type: 'overdue_payment',
        recipientEmail: 'tenant@example.com',
        tenantName: 'John Doe',
        propertyName: 'Sunset Apartments',
        unitNumber: '4A',
        amount: 7500,
        daysOverdue: 15,
      });

      expect(sms.message).toContain('URGENT');
      expect(sms.message).toContain('Sunset Apartments');
      expect(sms.message).toContain('4A');
      expect(sms.message).toContain('15 days');
      expect(sms.message).toContain('R 7,500');
      // SMS should be concise (under 160 characters for single SMS)
      expect(sms.message.length).toBeLessThanOrEqual(320); // Allow for 2 SMS parts
    });

    it('should generate upcoming rent SMS with correct format', () => {
      const sms = generateUpcomingRentSMS({
        type: 'upcoming_rent',
        recipientEmail: 'tenant@example.com',
        tenantName: 'Jane Smith',
        propertyName: 'Downtown Complex',
        unitNumber: '7B',
        amount: 6200,
        daysUntilDue: 5,
      });

      expect(sms.message).toContain('Reminder');
      expect(sms.message).toContain('Downtown Complex');
      expect(sms.message).toContain('7B');
      expect(sms.message).toContain('5 days');
      expect(sms.message).toContain('R 6,200');
    });

    it('should generate lease expiring SMS with correct format', () => {
      const sms = generateLeaseExpiringSMS({
        type: 'lease_expiring',
        recipientEmail: 'tenant@example.com',
        tenantName: 'Mike Johnson',
        propertyName: 'Garden Heights',
        unitNumber: '2C',
        daysUntilExpiry: 30,
      });

      expect(sms.message).toContain('lease');
      expect(sms.message).toContain('Garden Heights');
      expect(sms.message).toContain('2C');
      expect(sms.message).toContain('30 days');
    });
  });

  describe('Notification Content', () => {
    it('should include property and unit details in all templates', () => {
      const data = {
        type: 'overdue_payment' as const,
        recipientEmail: 'test@example.com',
        tenantName: 'Test Tenant',
        propertyName: 'Test Property',
        unitNumber: 'A1',
        amount: 5000,
        daysOverdue: 10,
      };

      const email = generateOverduePaymentEmail(data);
      const sms = generateOverduePaymentSMS(data);

      expect(email.body).toContain('Test Property');
      expect(email.body).toContain('A1');
      expect(sms.message).toContain('Test Property');
      expect(sms.message).toContain('A1');
    });

    it('should format currency correctly in notifications', () => {
      const amounts = [1000, 5000, 10000, 50000];

      amounts.forEach((amount) => {
        const email = generateOverduePaymentEmail({
          type: 'overdue_payment',
          recipientEmail: 'test@example.com',
          tenantName: 'Test',
          propertyName: 'Test',
          unitNumber: 'A1',
          amount,
          daysOverdue: 5,
        });

        expect(email.body).toContain(`R ${amount.toLocaleString()}`);
      });
    });

    it('should handle edge cases in notification data', () => {
      const data = {
        type: 'overdue_payment' as const,
        recipientEmail: 'test@example.com',
        tenantName: 'Test Tenant',
        propertyName: 'Test Property',
        unitNumber: 'A1',
        amount: 0,
        daysOverdue: 0,
      };

      const email = generateOverduePaymentEmail(data);
      const sms = generateOverduePaymentSMS(data);

      expect(email.body).toBeDefined();
      expect(sms.message).toBeDefined();
      expect(email.subject).toBeDefined();
    });
  });
});
