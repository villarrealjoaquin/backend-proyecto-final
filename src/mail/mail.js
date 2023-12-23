const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_SECRET
  }
});

async function sendPurchaseEmail(userEmail, cartItems) {
  let emailContent = `
      <h1>🎉 ¡Gracias por tu compra! 🎉</h1>
      <p>Hola,</p>
      <p>Estamos emocionados de confirmar que tu pedido ha sido procesado con éxito. Aquí están los detalles:</p>
      <hr>
      <ul>`;

  cartItems.forEach(item => {
    emailContent += `
        <li>
          <strong>Producto:</strong> ${item.product.title} <br>
          <strong>Cantidad:</strong> ${item.quantity} <br>
          <strong>Precio por unidad:</strong> $${item.product.price}
        </li>`;
  });

  emailContent += `
      </ul>
      <hr>
      <p>¡Tu pedido está en camino! 🚚</p>
      <p>Esperamos que disfrutes tus productos. Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>¡Gracias por confiar en nosotros! ❤️</p>
      <p>Saludos,<br><strong>Tu Equipo de Tienda</strong></p>`;

  const mailOptions = {
    from: process.env.MAILER_USER,
    to: userEmail,
    subject: '🛍️ Detalles de tu compra en Nuestra Tienda',
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de compra enviado a: ' + userEmail);
  } catch (error) {
    console.error('Error al enviar correo: ', error);
  }
}

module.exports = { sendPurchaseEmail };