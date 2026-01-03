export function otpEmailTemplate(name: string, code: string) {
  return {
    subject: "Your verification code",
    html: `
      <div style="font-family: sans-serif">
        <h2>Hey ${name}</h2>
        <h2>Verification Code</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px">${code}</h1>
        <p>This code will expire in 2 minutes.</p>
      </div>
    `,
    text: `Your OTP code is: ${code}`,
  };
}
