const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
    },
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
    },
    address: {
      type: String,
      required: [true, "L'adresse est requise"],
    },
    fixedPhone: {
      type: String,
      required: [true, "Le numéro de téléphone fixe est requis"],
      match: [/^0[1-9](\d{8})$/, "Numéro de téléphone fixe invalide"],
    },
    mobilePhone: {
      type: String,
      required: [true, "Le numéro de téléphone mobile est requis"],
      match: [/^0[67](\d{8})$/, "Numéro de téléphone mobile invalide"],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Veuillez fournir un email valide"],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
    },
    profilePhoto: {
      type: String,
      required: [true, "La photo de profil est requise"],
    },
    companyName: {
      type: String,
      default: null,
    },
    tradeName: {
      type: String,
      default: null,
    },
    SIRET: {
      type: String,
      match: [
        /^[0-9]{14}$/,
        "Le numéro SIRET doit être composé de 14 chiffres",
      ],
      default: null, // Défini par défaut à null
    },
    brandLogo: {
      type: String,
      default: null, // Défini par défaut à null
    },
    selectedDays: {
      type: [String],
      default: [], // Valeur par défaut est un tableau vide
    },
    deliveryTimes: {
      start: {
        type: String,
        default: null, // Défini par défaut à null
      },
      end: {
        type: String,
        default: null, // Défini par défaut à null
      },
    },
    termsGeneralAccepted: {
      type: Boolean,
      required: [true, "L'acceptation des termes généraux est requise"],
    },
    termsPrivacyAccepted: {
      type: Boolean,
      required: [
        true,
        "L'acceptation des termes de confidentialité est requise",
      ],
    },
    hasRentalContract: {
      type: Boolean,
      default: null, // Défini par défaut à null
    },
    hasInsuranceExtension: {
      type: Boolean,
      default: null, // Défini par défaut à null
    },
    plansToSubscribeInsurance: {
      type: Boolean,
      default: null, // Défini par défaut à null
    },
    role: {
      type: String,
      required: [true, "Le rôle est requis"],
      enum: ["lessor", "artisan", "consumer"],
    },
  },
  { timestamps: true }
);

// Vérification du mot de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hashage du mot de passe avant de sauvegarder l'utilisateur
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
