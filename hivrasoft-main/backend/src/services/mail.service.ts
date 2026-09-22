import transporter from "../config/mail";

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  await transporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      process.env.SMTP_USER,

    to: email,

    subject:
      "Your HivraSoft verification code",

    html: `
      <div
        style="
          max-width:520px;
          margin:0 auto;
          padding:32px;
          font-family:Arial,sans-serif;
          color:#211A18;
        "
      >
        <h2
          style="
            margin:0 0 25px;
            letter-spacing:3px;
          "
        >
          HIVRASOFT
        </h2>

        <p>
          Your verification code is:
        </p>

        <div
          style="
            font-size:34px;
            font-weight:700;
            letter-spacing:10px;
            margin:30px 0;
            color:#8C1839;
          "
        >
          ${otp}
        </div>

        <p>
          This OTP is valid for
          ${
            process.env
              .OTP_EXPIRES_MINUTES ||
            "5"
          }
          minutes.
        </p>

        <p
          style="
            margin-top:30px;
            font-size:12px;
            color:#777;
          "
        >
          If you did not request this code,
          please ignore this email.
        </p>
      </div>
    `,
  });
};