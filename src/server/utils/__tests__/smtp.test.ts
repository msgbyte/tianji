import { describe, it, expect } from 'vitest';
import { generateSMTPHTML, sendEmail } from '../smtp.js';

describe('generateSMTPHTML', () => {
  it('should generate HTML email with only body content', () => {
    const body = '<p>This is test email content</p>';
    const result = generateSMTPHTML(body);

    // Verify HTML structure
    expect(result).toContain(
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"'
    );
    expect(result).toContain(
      '<html xmlns="http://www.w3.org/1999/xhtml" lang="en">'
    );

    // Verify body content is correctly injected
    expect(result).toContain(body);

    // Verify button does not exist
    expect(result).not.toContain('class="btn"');
  });

  it('should generate HTML email with button', () => {
    const body = '<p>This is test email content with button</p>';
    const button = {
      title: 'View Details',
      url: 'https://example.com/details',
    };

    const result = generateSMTPHTML(body, button);

    // Verify HTML structure
    expect(result).toContain(
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"'
    );
    expect(result).toContain(
      '<html xmlns="http://www.w3.org/1999/xhtml" lang="en">'
    );

    // Verify body content is correctly injected
    expect(result).toContain(body);

    // Verify button exists and contains correct information
    expect(result).toContain(button.title);
    expect(result).toContain(button.url);
  });

  it('should include Tianji brand information', () => {
    const body = '<p>Test email</p>';
    const result = generateSMTPHTML(body);

    // Verify brand information exists
    expect(result).toContain('Tianji');
    expect(result).toContain('Insight into everything');
    expect(result).toContain('https://tianji.msgbyte.com/img/logo@128.png');
  });

  it('should include footer and social media links', () => {
    const body = '<p>Test email</p>';
    const result = generateSMTPHTML(body);

    // Verify footer information
    expect(result).toContain('If you did not expect to receive this email');
    expect(result).toContain('Tianji. All rights reserved.');

    // Verify social media links
    expect(result).toContain('https://github.com/msgbyte/tianji');
    expect(result).toContain('https://twitter.com/moonrailgun');
  });
});

describe.runIf(
  process.env.TEST_TARGET_EMAIL &&
    process.env.EMAIL_SERVER &&
    process.env.EMAIL_FROM
)('sendEmail', () => {
  // This test will only run if the TARGET_EMAIL environment variable is set
  it('should send actual email to target address when environment variable is set', async () => {
    // Skip test if TARGET_EMAIL is not defined
    const targetEmail = process.env.TEST_TARGET_EMAIL;

    // Test data
    const emailOptions = {
      to: String(targetEmail),
      subject: 'Tianji Test Email',
      body: '<p>This is a test email from Tianji automated tests</p>',
      button: {
        title: 'Visit Tianji',
        url: 'https://tianji.msgbyte.com',
      },
    };

    // Send the email
    const result = await sendEmail(emailOptions);

    // Verify the email was sent successfully
    expect(result).toBeDefined();
    expect(result.messageId).toBeDefined();
  });
});
