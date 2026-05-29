const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendBookingConfirmation = async ({
  to,
  userName,
  parkingTitle,
  parkingAddress,
  startTime,
  endTime,
  totalAmount,
  bookingId,
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured — skipping booking confirmation email.')
    return
  }

  const formatDT = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })

  const shortId = bookingId ? bookingId.slice(0, 14) + '...' : 'N/A'

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#1d4ed8;padding:28px 36px;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ParkEase</h1>
                <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Parking made simple</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;">
                <p style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Booking Confirmed</p>
                <p style="margin:0 0 28px;color:#64748b;font-size:14px;">Hello ${userName}, your parking slot has been successfully booked.</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Booking ID</p>
                      <p style="margin:4px 0 0;color:#1e293b;font-size:13px;font-family:monospace;">${shortId}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Parking Location</p>
                      <p style="margin:4px 0 0;color:#1e293b;font-size:15px;font-weight:600;">${parkingTitle}</p>
                      ${parkingAddress ? `<p style="margin:2px 0 0;color:#64748b;font-size:13px;">${parkingAddress}</p>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Start Time</p>
                      <p style="margin:4px 0 0;color:#1e293b;font-size:14px;">${formatDT(startTime)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">End Time</p>
                      <p style="margin:4px 0 0;color:#1e293b;font-size:14px;">${formatDT(endTime)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total Amount</p>
                      <p style="margin:4px 0 0;color:#1d4ed8;font-size:18px;font-weight:700;">Rs. ${Number(totalAmount).toFixed(0)}</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td align="center">
                      <a href="${process.env.FRONTEND_URL || 'https://your-app.replit.app'}/dashboard"
                         style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                        View your booking
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                  Thank you for choosing ParkEase. You can view or manage your booking from your dashboard at any time.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">ParkEase &mdash; This is an automated message. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"ParkEase" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Booking Confirmed - ParkEase',
      html,
    })
  } catch (err) {
    console.error('Failed to send booking email:', err.message)
  }
}

module.exports = { sendBookingConfirmation }
