const userModel = require('../../models/user.model');

class UserRepository {
  async addUser(user) {
    try {
      const existingUser = await userModel.findOne({ email: user.email });

      if (existingUser) {
        return false;
      }

      await userModel.create(user);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async login(username, password) {
    try {
      const userLogged = await userModel.findOne({ email: username, password: password }) || null;

      if (userLogged) {

        if (username === 'adminCoder@coder.com' && password === 'adminCod3r123') {
          userLogged.role = 'admin';
        } else {
          userLogged.role = 'user';
        }

        await userLogged.save();

        return userLogged;
      }

      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getInactiveUsers(inactiveThreshold) {
    try {
      return await userModel.find({ lastConnection: { $lt: inactiveThreshold } });
    } catch (error) {
      return null;
    }
  }

  async deleteUserById(userId) {
    try {
      return await userModel.findByIdAndDelete(userId);
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      return await userModel.findOne({ email });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getUserByResetToken(resetToken) {
    try {
      return await userModel.findOne({ resetPasswordToken: resetToken });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getUserById(id) {
    try {
      return await userModel.find({ _id: id });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getDocumentUploadStatus(userId) {
    try {
      const user = await userModel.findById(userId);
      if (!user)  return null;
      
      const requiredDocuments = ['identificacion.png', 'comprobante_domicilio.png', 'comprobante_estado_cuenta.png'];
      const uploadedDocuments = user.documents.map(doc => doc.name.toLowerCase());
      const isAllDocumentsUploaded = requiredDocuments.every(doc => uploadedDocuments.includes(doc));

      return isAllDocumentsUploaded;
    } catch (error) {
      return null;
    }
  }

  async getAllUsers() {
    try {
      const users = await userModel.find();
      return users;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = UserRepository;
