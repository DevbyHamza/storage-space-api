const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    firstName,
    address,
    fixedPhone,
    mobilePhone,
    email,
    password,
    companyName,
    tradeName,
    SIRET,
    deliveryTimes,
    deliveryDays,
    retrievalTimes,
    retrievalDays,
    termsGeneralAccepted,
    termsPrivacyAccepted,
    hasRentalContract,
    hasInsuranceExtension,
    plansToSubscribeInsurance,
    role,
  } = req.body;

  const profilePhoto = req.files["profilePhoto"]
    ? `/uploads/${req.files["profilePhoto"][0].filename}`
    : null;
  const brandLogo = req.files["brandLogo"]
    ? `/uploads/${req.files["brandLogo"][0].filename}`
    : null;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "L'utilisateur existe déjà" });
    }

    const user = new User({
      name,
      firstName,
      address,
      fixedPhone,
      mobilePhone,
      email,
      password,
      companyName,
      tradeName,
      SIRET,
      deliveryTimes,
      deliveryDays,
      retrievalTimes,
      retrievalDays,
      termsGeneralAccepted,
      termsPrivacyAccepted,
      hasRentalContract,
      hasInsuranceExtension,
      plansToSubscribeInsurance,
      role,
      profilePhoto,
      brandLogo,
    });

    await user.save();

    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Inscription réussie",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        address: user.address,
        fixedPhone: user.fixedPhone,
        mobilePhone: user.mobilePhone,
        email: user.email,
        profilePhoto: user.profilePhoto,
        brandLogo: user.brandLogo,
        companyName: user.companyName,
        tradeName: user.tradeName,
        SIRET: user.SIRET,
        deliveryTimes: user.deliveryTimes,
        deliveryDays: user.deliveryDays,
        retrievalTimes: user.retrievalTimes,
        retrievalDays: user.retrievalDays,
        termsGeneralAccepted: user.termsGeneralAccepted,
        termsPrivacyAccepted: user.termsPrivacyAccepted,
        hasRentalContract: user.hasRentalContract,
        hasInsuranceExtension: user.hasInsuranceExtension,
        plansToSubscribeInsurance: user.plansToSubscribeInsurance,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Connexion réussie",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        address: user.address,
        fixedPhone: user.fixedPhone,
        mobilePhone: user.mobilePhone,
        email: user.email,
        profilePhoto: user.profilePhoto,
        brandLogo: user.brandLogo,
        companyName: user.companyName,
        tradeName: user.tradeName,
        SIRET: user.SIRET,
        deliveryTimes: user.deliveryTimes,
        deliveryDays: user.deliveryDays,
        retrievalTimes: user.retrievalTimes,
        retrievalDays: user.retrievalDays,
        termsGeneralAccepted: user.termsGeneralAccepted,
        termsPrivacyAccepted: user.termsPrivacyAccepted,
        hasRentalContract: user.hasRentalContract,
        hasInsuranceExtension: user.hasInsuranceExtension,
        plansToSubscribeInsurance: user.plansToSubscribeInsurance,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser };
