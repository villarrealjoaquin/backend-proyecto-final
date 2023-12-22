const UserRepository = require('../../dao/users/userRepository/userRepository');
const querystring = require('querystring');
const userRepository = new UserRepository();
const passport = require('passport');
const transporter = require('../../config/mailer')
const crypto = require('crypto');

class UserController {
  async register(req, res) {
    try {
      if (!req.user) return res.status(401).send({ message: 'Invalid User' });
      const token = req.user.token;

      res.cookie('coderToken', token);
      res.send({ status: 'OK', message: 'Usuario registrado' });

    } catch (error) {
      res.status(500).json({ error: 'Error al registrarse!' });
    }
  }

  async login(req, res) {
    try {
      if (!req.user) return res.status(401).send({ message: 'Invalid User' });
      const token = req.user.token;
      res.cookie('coderToken', token);
      res.send({ status: 200, message: 'Usuario registrado' });
    } catch (error) {
      res.status(404).json({ error: 'El usuario ingresado no existe' })
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await userRepository.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpiration = Date.now() + 3600000;

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiration = resetExpiration;

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.MAILER_USER,
        to: user.email,
        subject: 'Restablecimiento de Contraseña',
        html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
              <a href="${resetLink}">${resetLink}</a>`,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error('Error al enviar el correo de restablecimiento:', error);
          return res.status(500).json({ error: 'Error al enviar el correo de restablecimiento' });
        }
        res.status(200).json({ message: 'Correo de restablecimiento enviado con éxito' });
      });
    } catch (error) {
      console.error('Error en la solicitud de restablecimiento de contraseña:', error);
      res.status(500).json({ error: 'Error en la solicitud de restablecimiento de contraseña' });
    }
  }

  async deleteInactiveUsers(req, res) {
    try {
      const inactiveThreshold = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const inactiveUsers = await userRepository.getInactiveUsers(inactiveThreshold);

      for (const user of inactiveUsers) {
        const mailOptions = {
          from: process.env.MAILER_USER,
          to: user.email,
          subject: 'Eliminación de cuenta por inactividad',
          html: `<p>Tu cuenta ha sido eliminada debido a la inactividad.</p>`,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.error('Error al enviar el correo de eliminación por inactividad:', error);
          }
        });

        await userRepository.deleteUserById(user._id);
      }

      res.status(200).json({ message: 'Usuarios inactivos eliminados con éxito' });
    } catch (error) {
      console.error('Error al eliminar usuarios inactivos:', error);
      res.status(500).json({ error: 'Error al eliminar usuarios inactivos' });
    }
  }

  async githubCallBack(req, res) {
    req.session.user = req.user;
    req.session.loggedIn = true;
    res.redirect('/products');
  }

  async authenticateRegister(req, res, next) {
    passport.authenticate('register', { failureRedirect: '/failregister' })(req, res, next);
  }

  async authenticateLogin(req, res, next) {
    passport.authenticate('login', { failureRedirect: '/faillogin' })(req, res, next);
  }

  githubAuthenticate(req, res, next) {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }

  githubCallbackAuthenticate(req, res, next) {
    passport.authenticate('github', { failureRedirect: '/login' })(req, res, next);
  }

  current(req, res) {
    try {
      if (req.cookies.coderToken) {
        const userDTO = {
          id: req.user.user.id,
          nombre: req.user.user.nombre,
          correo: req.user.user.correo,
        };

        res.json(userDTO);
      } else {
        res.status(401).json({ message: 'Usuario no autenticado' });
      }
    } catch (error) {
      res.status(404).json({ error: 'El usuario no se encuentra autenticado' })
    }
  }

  logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al cerrar sesión:', err);
        }

        res.redirect('/');
      });
    } catch (error) {
      res.status(500).json({ error: 'La sesión no ha podido destruirse' })
    }
  }

  async uploadDocuments(req, res) {
    try {
      const uid = req.params.uid;
      const user = await userRepository.getUserById(uid);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      for (const field in req.files) {
        if (Object.hasOwnProperty.call(req.files, field)) {
          const uploadedField = req.files[field].map(file => ({
            name: file.originalname,
            reference: `/uploads/${field}/${file.originalname}`,
          }));

          user[0]?.documents?.push(...uploadedField);
        }
      }

      const isDocumentsUploaded = await userRepository.getDocumentUploadStatus(uid);

      if (isDocumentsUploaded) {
        user[0].isPremium = true;
      }

      await user[0].save()

      res.status(200).json({ message: 'Documentos subidos con éxito', user: user });
    } catch (error) {
      console.error('Error al subir documentos:', error);
      res.status(500).json({ error: 'Error al subir documentos' });
    }
  }

  async getUserById(req, res) {
    try {
      const userId = req.params.uid;

      const user = await userRepository.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json({ user: user });
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      res.status(500).json({ error: 'Error al obtener usuario por ID' });
    }
  }

  async getUserPremium(req, res) {
    try {
      const userId = req.params.uid;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const isDocumentsUploaded = await userRepository.getDocumentUploadStatus(userId);

      if (!isDocumentsUploaded) {
        return res.status(400).json({ error: 'El usuario no ha completado la carga de documentos requeridos' });
      }

      user[0].isPremium = true;
      await user[0].save();

      res.status(200).json({ message: 'Usuario actualizado a premium con éxito', user: user });
    } catch (error) {
      console.error('Error al obtener usuario premium:', error);
      res.status(500).json({ error: 'Error al obtener usuario premium' });
    }
  }

  async getAllUser() {
    const users = await userRepository.getAllUser()
    res.status(200).json(users);
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      console.log('entre delete');
      await userRepository.deleteUserById(userId);


      res.status(200).json({ message: 'Usuario eliminado con éxito.' });
      // res.redirect('/dashboard');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
  }

  async changeUserRole(req, res) {
    try {
      const { userId, role } = req.body;

      const allowedRoles = ['user', 'moderator', 'admin'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Role no válido' });
      }

      const user = await userRepository.getUserById(userId);


      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      user[0].role = role;
      await user[0].save();

      res.status(200).json({ message: 'Role cambiado con éxito', user: user });
    } catch (error) {
      console.error('Error al cambiar el role:', error);
      res.status(500).json({ error: 'Error al cambiar el role' });
    }
  }
}

module.exports = new UserController();
