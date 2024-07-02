
import { createRequire } from "module";
import { createTransport } from "nodemailer";
import { nodemailerMjmlPlugin } from "nodemailer-mjml";
import path, { join } from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
require('dotenv').config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { program } = require('commander'); // (normal include)
program
  .option('-v, --variant <string>')
  .option('-t, --to <string>');

program.parse();

const options = program.opts();
const variant  = options.variant;
const to  = options.to;

const transport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Register nodemailer-mjml to your nodemailer transport
transport.use(
  "compile",
  nodemailerMjmlPlugin({ templateFolder: join(__dirname, `./../../variants/${variant}/`) })
);

const sendTemplatedEmail = async () => {
  await transport.sendMail({
    from: `"${process.env.SENDER_NAME}" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject: `[TEST] ${variant}`,
    templateName: variant,
    templateData: {
      userName: process.env.SENDER_NAME,
    },
  });
  console.log(`Test email for ${variant} variant is sent to: ` + to);
};

sendTemplatedEmail();