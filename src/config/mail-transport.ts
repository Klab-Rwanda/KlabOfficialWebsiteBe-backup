import nodemailer from 'nodemailer';

export async function createTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Missing email credentials');
    }
    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE ||'Gmail',
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
  
    try {
      await transporter.verify();
    } catch (error) {
      console.error('Email configuration nodemailer error:', error);
      throw new Error('Failed to connect to email service. Please check your email configurations.');
    }
    return transporter;
  }