const Sauce = require("../models/sauce");
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

// Enregistrer une nouvelle sauce
exports.createSauce = (req, res, next) => {
  if (req.file.size > 5000000) {
    res.status(400).json({ message: "le fichier est trop volumineux" });
  } else {
    const { filename: image } = req.file;
    sharp(req.file.path)
      .resize(500)
      .jpeg({ quality: 50 })
      .toFile(path.resolve(req.file.destination, "resized", image));

    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get("host")}/images/resized/${
        req.file.filename
      }`,
      likes: 0,
      dislikes: 0,
    });
    sauce
      .save()
      .then(() => res.status(201).json({ message: "Objet enregistré!" }))
      .catch((error) => res.status(400).json({ error }));
  }
};

// Modifier une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        // Si l'utilisateur modifie l'image:
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body }; // Sinon: modification simple
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() =>
      res.status(200).json({ message: "L'objet a bien été modifié !" })
    )
    .catch((error) => res.status(400).json({ error }));
};

// Like ou dislike une sauce
exports.likeSauce = (req, res, next) => {
  Sauce.findById(req.params.id)
    .then((sauce) => {
      let hasLiked = sauce.usersLiked.includes(req.body.userId);
      let hasDisliked = sauce.usersDisliked.includes(req.body.userId);
      if (hasLiked && req.body.like == 1) {
        return res.status(400).json({ error: "Has already liked!" });
      } else if (hasDisliked && req.body.like == -1) {
        res.status(400).json({ error: "Has already disliked!" });
        return;
      } else if (req.body.like == 1) {
        Sauce.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: {
              likes: 1,
            },
            $push: {
              usersLiked: req.body.userId,
            },
          },
          { new: true } // Pour renvoyer le résultat APRES que le document ait été mis à jour
        )
          .then((updatedSauce) => {
            res.status(200).json(updatedSauce.likes);
          })
          .catch((error) => res.status(500).json({ error }));
      } else if (req.body.like == -1) {
        Sauce.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: {
              dislikes: 1,
            },
            $push: {
              usersDisliked: req.body.userId,
            },
          },
          { new: true }
        )
          .then((updatedSauce) => {
            res.status(200).json(updatedSauce.likes);
          })
          .catch((error) => res.status(500).json({ error }));
        console.log("je n'aime pas!");
        console.log(sauce.dislikes + " " + sauce.usersDisliked);
      } else if (req.body.like == 0) {
        if (hasLiked) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: {
                likes: -1,
              },
              $pull: {
                usersLiked: req.body.userId,
              },
            },
            (error, res) => {
              console.log("error: " + error);
              console.log("Je change d'avis");
              console.log(
                "likes: " +
                  sauce.likes +
                  ", dislikes: " +
                  sauce.dislikes +
                  ", Users who liked: " +
                  sauce.usersLiked +
                  ", Users who disliked: " +
                  sauce.usersDisliked
              );
            }
          );
        } else if (hasDisliked) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: {
                dislikes: -1,
              },
              $pull: {
                usersDisliked: req.body.id,
              },
              _id: req.params.id,
            },
            (error, res) => {
              console.log("error: " + error);
              console.log("Je change d'avis");
              console.log(
                "likes: " +
                  sauce.likes +
                  ", dislikes: " +
                  sauce.dislikes +
                  ", Users who liked: " +
                  sauce.usersLiked +
                  ", Users who disliked: " +
                  sauce.usersDisliked
              );
            }
          )
            .then(() => res.status(200).json({}))
            .catch((error) => res.status(400).json({ error }));
        }
      }
    })
    // .then(() => res.status(200).json({ message: req.body.message }))
    .catch((error) => {
      console.error(error);
      res.status(400).json({ error });
    });
  // const sauceObject = req.body.sauce;
  // Sauce.updateOne(
  //   { _id: req.params.id },
  //   {
  //     $set: {
  //       likes: sauceObject.likes,
  //       dislikes: sauceObject.dislikes,
  //       usersDisliked: sauceObject.usersDisliked,
  //       usersLiked: sauceObject.usersLiked,
  //     },
  //     _id: req.params.id,
  //   }
  // );
};

// Supprimer une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findById(req.params.id) // Trouve l'objet dans la DB, récupère le nom du fichier dans son url, et le supprime
    .then((sauce) => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() =>
            res.status(200).json({ message: "L'objet a bien été supprimé !" })
          )
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

// Renvoie la sauce avec l'ID fourni
exports.getOneSauce = (req, res, next) => {
  Sauce.findById(req.params.id)
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(400).json({ error }));
};

// Renvoie le tableau de toutes les sauces dans la base de données
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .exec()
    .then((sauces) => res.send(sauces))
    .catch((error) => res.status(400).json({ error }));
};
