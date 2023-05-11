import userModel from "../models/user.model.js";
import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";

const signup = async (req, res) => {
  console.log("Wubba dubaa lub lub")
  try {
    const { username, password, displayName } = req.body;

    const checkUser = await userModel.findOne({ username });

    if (checkUser) return responseHandler.badrequest(res, "username already used");

    const user = new userModel();

    user.displayName = displayName;
    user.username = username;
    user.setPassword(password);

    await user.save();
    console.log("Damn foff");
    console.log(user._doc)
    console.log(user.id)
    console.log(process.env.TOKEN_SECRET_KEY)
    const token = jsonwebtoken.sign(
      { data: user.id },
      process.env.TOKEN_SECRET_KEY,
      { expiresIn: "24h" }
    );
    console.log("After token signing");

    responseHandler.created(res, {
      token,
      ...user._doc,
      id: user.id
    });
    console.log("Success")
  } catch(error) {
    responseHandler.error(res);
    console.log(error);
    console.log("Failed AF")
  }
};

const signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username }).select("username password salt id displayName");

    if (!user) return responseHandler.badrequest(res, "User not exist");

    if (!user.validPassword(password)) return responseHandler.badrequest(res, "Wrong password");

    const token = jsonwebtoken.sign(
      { data: user.id },
      process.env.TOKEN_SECRET_KEY,
      { expiresIn: "24h" }
    );

    user.password = undefined;
    user.salt = undefined;

    responseHandler.created(res, {
      token,
      ...user._doc,
      id: user.id
    });
  } catch(error) {
    console.log(error)
    responseHandler.error(res);
  }
};

const updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    const user = await userModel.findById(req.user.id).select("password id salt");

    if (!user) return responseHandler.unauthorize(res);

    if (!user.validPassword(password)) return responseHandler.badrequest(res, "Wrong password");

    user.setPassword(newPassword);

    await user.save();

    responseHandler.ok(res);
  } catch {
    responseHandler.error(res);
  }
};

const getInfo = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) return responseHandler.notfound(res);

    responseHandler.ok(res, user);
  } catch {
    responseHandler.error(res);
  }
};

export default {
  signup,
  signin,
  getInfo,
  updatePassword
};