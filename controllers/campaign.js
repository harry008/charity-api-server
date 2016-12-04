import Campaign from '../models/Campaign';

export function getCampign(req, res) {
  Campaign
    .findById(req.params.id)
    .populate('patients', 'doctors')
    .exec()
    .then(campaign => {
      return res.json({
        error: false,
        campaign
      });
    })
    .catch(err => {
      return res.status(500).json({
        error: true,
        message: 'Internal server error.'
      });
    });
}

export function getCampaigns(req, res) {
  Campaign
    .find({})
    .sort({ created_at: -1, eventDate: -1 })
    .populate('patients', 'doctors')
    .exec()
    .then(campaigns => {
      return res.json({
        error: false,
        campaigns
      });
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    });
}

export function postCampaign(req, res) {
  req.assert('title', 'Campaign title should not be empty.').notEmpty();
  req.assert('description', 'Description should not be empty').notEmpty();
  req.assert('address', 'Address should not be empty.').notEmpty();
  req.assert('city', 'City name should not be empty.').notEmpty();
  req.assert('pin', 'pin should be empty.').notEmpty();
  req.assert('state', 'State name should not be empty.').notEmpty();
  req.assert('eventDate', 'Event date should be provided').notEmpty();

  req.sanitize('title').escape();
  req.sanitize('description').escape();
  req.sanitize('address').escape();
  req.sanitize('city').escape();
  req.sanitize('pin').escape();
  req.sanitize('state').escape();

  const errors = req.validationErrors();

  if (errors) {
    return res.json({
      error: true,
      errors
    });
  }

  const campData = {
    title: req.body.title,
    eventDate: req.body.eventDate,
    description: req.body.description,
    place: {
      address: req.body.address,
      city: req.body.city,
      pin: req.body.pin,
      state: req.body.state
    },
  };

  const camp = new Campaign(campData);
  camp.save(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: true,
        message: 'Internal server error.'
      });
    }
    return res.json({
      error: false,
      message: 'Campaign created successfully!'
    });
  });
}

export function registerCampaign(req, res) {
  const campId = req.params.id;
  const pat = req.body.patient_id;
  const doc = req.body.doctor_id;
  // Using $addToSet Operator for pushing doctor/patient to
  // respective array. This will allow only unique items
  // This does not raise error about duplicate value instead just return the same model
  // if (pat && !doc) {
  //   Campaign.findByIdAndUpdate(campId, {
  //     $addToSet: { patients: pat },
  //   }, { new: true })
  //   .exec()
  //   .then(camp => {
  //     return res.json({
  //       error: false,
  //       campaign: camp
  //     });
  //   })
  //   .catch(err => {
  //     console.error('Patient Registration error', err);
  //     return res.json({
  //       error: true,
  //       errorObj: err
  //     });
  //   });
  // } else if (doc && !pat) {
  //   Campaign.findByIdAndUpdate(campId, {
  //     $addToSet: { doctors: doc },
  //   }, { new: true })
  //   .exec()
  //   .then((camp, err) => {
  //     console.log(camp);
  //     console.log(err);
  //     return res.json({
  //       error: false,
  //       campaign: camp
  //     });
  //   })
  //   .catch(err => {
  //     console.error('Doctor Registration error', err);
  //     return res.json({
  //       error: true,
  //       errorObj: err
  //     });
  //   });
  // }
Campaign
  .findById(campId)
  .exec()
  .then(camp => {
    if (!camp) {
      return res.status(404).json({
        error: true,
        message: 'Campaign Not Found!'
      });
    }
    let isRegistered = false;
    if (pat && !doc) {
      if (camp.patients && camp.patients.length) {
        for (let i = camp.patients.length - 1; i >= 0; i--) {
          // === fails here have to rely on ==
          if (camp.patients[i] == pat) { //eslint-disable-line
            isRegistered = true;
            break;
          }
        }
      }
      if (!isRegistered) {
        camp.patients.push(pat);
      } else {
        return res.json({
          error: true,
          message: 'Already registered.'
        });
      }
    } else if (doc && !pat) {
      if (camp.doctors && camp.doctors.length) {
        for (let i = camp.doctors.length - 1; i >= 0; i--) {
          // === fails here have to rely on ==
          if (camp.doctors[i] == doc) { //eslint-disable-line
            isRegistered = true;
            break;
          }
        }
      }
      if (!isRegistered) {
        camp.doctors.push(doc);
      } else {
        return res.json({
          error: true,
          message: 'Already registered.'
        });
      }
    }

    camp.save((err, cmp) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: true,
          message: 'Internal server error'
        });
      }
      return res.json({
        error: false,
        message: 'Success!',
        campaign: cmp
      });
    });
  })
  .catch(err => {
    console.error(err);
    return res.status(500).json({
      error: true,
      message: 'Internal server error'
    });
  });
}

export function updateCampaign(req, res) {
  req.assert('id', 'Campaign ID is required').notEmpty();
  req.assert('title', 'Campaign title should not be empty.').notEmpty();
  req.assert('description', 'Description should not be empty').notEmpty();
  req.assert('address', 'Address should not be empty.').notEmpty();
  req.assert('city', 'City name should not be empty.').notEmpty();
  req.assert('pin', 'pin should be empty.').notEmpty();
  req.assert('state', 'State name should not be empty.').notEmpty();
  req.assert('eventDate', 'Date must be entered').notEmpty();

  req.sanitize('title').escape();
  req.sanitize('description').escape();
  req.sanitize('address').escape();
  req.sanitize('city').escape();
  req.sanitize('pin').escape();
  req.sanitize('state').escape();

  const errors = req.validationErrors();

  if (errors) {
    return res.json({
      error: true,
      errors
    });
  }
  const id = req.params.id;
  console.log('campaign_id %s', id);
  Campaign
    .findById(id)
    .exec()
    .then(camp => {
      if (!camp) {
        console.log('Campaign not found');
        return res.status(404).json({
          error: true,
          message: 'Internal server error.'
        });
      }
      const campData = {
        title: req.body.title,
        eventDate: req.body.eventDate,
        description: req.body.description,
        place: {
          address: req.body.address,
          city: req.body.city,
          pin: req.body.pin,
          state: req.body.state
        },
      };
      camp = Object.assign(camp, campData);
      camp.save(err => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: true,
            message: 'Internal server error.'
          });
        }
        return res.json({
          error: false,
          message: 'Campaign saved successfully!'
        });
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({
        error: true,
        message: 'Internal server error.'
      });
    });
}
