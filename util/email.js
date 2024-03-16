const nodemailer = require('nodemailer');

const sendMail = async (options) => {
    try {
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'bluelooktechnology@gmail.com',
                pass: 'cjzziehdisevvkyw'
            }
        });

        const mailOptions = {
            from: options.email,
            to: 'mytempname321@gmail.com',
            subject: 'Contact',
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Styled Table Template</title>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .styled-table {
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 0.9em;
            min-width: 400px;
            width: 100%;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
          }
          .styled-table thead tr {
            background-color: #009879;
            color: #ffffff;
            text-align: left;
          }
          .styled-table th,
          .styled-table td {
            padding: 12px 15px;
          }
          .styled-table tbody tr {
            border-bottom: 1px solid #dddddd;
          }
          .styled-table tbody tr:nth-of-type(even) {
            background-color: #f3f3f3;
          }
          .styled-table tbody tr:last-of-type {
            border-bottom: 2px solid #009879;
          }
          .styled-table tbody tr.active-row {
            font-weight: bold;
            color: #009879;
          }
        </style>
        </head>
        <body>
        
        <table class="styled-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Order Number</th>
              <th>Category</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <!-- Add your data here -->
            <tr>
              <td>${options.firstName}</td>
              <td>${options.lastName}</td>
              <td>${options.email}</td>
              <td>${options.phone}</td>
              <td>${options.order}</td>
              <td>${options.category}</td>
              <td>${options.message}</td>
            </tr>
            <!-- More rows as needed -->
          </tbody>
        </table>
        
        </body>
        </html>
        
        `,
            attachments: options.attachments
        };

        await transport.sendMail(mailOptions);
    } catch (err) {
        console.log(err);
    }
};

module.exports = sendMail;
