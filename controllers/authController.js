const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

  const profilePhoto =
    req.uploadedImages &&
    req.uploadedImages.find((image) => image.field === "profilePhoto")
      ? req.uploadedImages.find((image) => image.field === "profilePhoto").url
      : null;

  const brandLogo =
    req.uploadedImages &&
    req.uploadedImages.find((image) => image.field === "brandLogo")
      ? req.uploadedImages.find((image) => image.field === "brandLogo").url
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
        stripeAccountId: user.stripeAccountId,
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
        stripeAccountId: user.stripeAccountId,
      },
      token,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
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
    companyName,
    tradeName,
    SIRET,
    deliveryTimes,
    deliveryDays,
    retrievalTimes,
    retrievalDays,
  } = req.body;

  const profilePhoto =
    req.uploadedImages &&
    req.uploadedImages.find((image) => image.field === "profilePhoto")
      ? req.uploadedImages.find((image) => image.field === "profilePhoto").url
      : null;

  const brandLogo =
    req.uploadedImages &&
    req.uploadedImages.find((image) => image.field === "brandLogo")
      ? req.uploadedImages.find((image) => image.field === "brandLogo").url
      : null;

  try {
    // Ensure the user is authenticated
    const userId = req.user.id; // Assuming the user is authenticated and their ID is stored in req.user (from JWT middleware)

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Update only the allowed fields, excluding sensitive ones like email, terms, etc.
    user.name = name || user.name;
    user.firstName = firstName || user.firstName;
    user.address = address || user.address;
    user.fixedPhone = fixedPhone || user.fixedPhone;
    user.mobilePhone = mobilePhone || user.mobilePhone;
    user.companyName = companyName || user.companyName;
    user.tradeName = tradeName || user.tradeName;
    user.SIRET = SIRET || user.SIRET;
    user.deliveryTimes = deliveryTimes || user.deliveryTimes;
    user.deliveryDays = deliveryDays || user.deliveryDays;
    user.retrievalTimes = retrievalTimes || user.retrievalTimes;
    user.retrievalDays = retrievalDays || user.retrievalDays;

    // Handle images (profile photo and brand logo)
    user.profilePhoto = profilePhoto || user.profilePhoto;
    user.brandLogo = brandLogo || user.brandLogo;

    // Save the updated user profile
    await user.save();

    res.status(200).json({
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        address: user.address,
        fixedPhone: user.fixedPhone,
        mobilePhone: user.mobilePhone,
        email: user.email, // Send email in response, but not updating it
        profilePhoto: user.profilePhoto,
        brandLogo: user.brandLogo,
        companyName: user.companyName,
        tradeName: user.tradeName,
        SIRET: user.SIRET,
        deliveryTimes: user.deliveryTimes,
        deliveryDays: user.deliveryDays,
        retrievalTimes: user.retrievalTimes,
        retrievalDays: user.retrievalDays,
        termsGeneralAccepted: user.termsGeneralAccepted, // Send but not update
        termsPrivacyAccepted: user.termsPrivacyAccepted, // Send but not update
        hasRentalContract: user.hasRentalContract, // Send but not update
        hasInsuranceExtension: user.hasInsuranceExtension, // Send but not update
        plansToSubscribeInsurance: user.plansToSubscribeInsurance, // Send but not update
        role: user.role, // Send but not update
        stripeAccountId: user.stripeAccountId,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du profil :", err);
    res.status(500).json({ message: err.message });
  }
};
const onboardUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Create a Stripe account but DO NOT save it in the database yet
    const account = await stripe.accounts.create({
      type: "standard",
      email: user.email,
    });

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id, // Use new account ID
      refresh_url: `${process.env.FRONTEND_URL}/profile`,
      return_url: `${process.env.FRONTEND_URL}/profile`,
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url, stripeAccountId: account.id });
  } catch (error) {
    console.error("Erreur lors de la connexion à Stripe :", error);
    res.status(500).json({ message: "Impossible de connecter Stripe" });
  }
};

module.exports = { registerUser, loginUser, updateProfile, onboardUser };
