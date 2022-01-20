const bcrypt = require('bcrypt');

const saltRounds = 10;

const db = require('../models/index.js');

// const { User } = db;
const User = db.sequelize.define('employee', {
    // Model 的屬性都是定義在這裡
  }, {
    freezeTableName: true
    // 其它的 model 選項填寫在這裡
  });
const userController = {
  login: (req, res) => {
    res.render('index');
  },

  handleLogin: (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash('errorMessage', '請輸入帳號密碼');
      return next();
    }
    // bcrypt.hash('xp22710249', saltRounds, (err, hash) => {console.log(hash);})
    User.findOne({
      where: {account: username,},
      attributes: ['uid', 'account', 'pwd', 'name'],
    })
      .then((employee) => {
          employee = JSON.parse(JSON.stringify(employee));//沒parse成obj格式會有錯誤
        if (!employee) {
          req.flash('errorMessage', '使用者帳號或密碼錯誤');
          return next();
        }
        bcrypt.compare(password, employee.pwd,(err, result) => {
          if (err || !result) {
            console.log("result = "+result);
            req.flash('errorMessage', '使用者帳號或密碼錯誤');
            return next();
          }
          req.session.username = employee.account;
          res.redirect('/manage');
        });
      })
      .catch((err) => {
        req.flash('errorMessage', err.toString());
        return next();
      });
  },

  logout: (req, res) => {
    req.session.username = null;
    res.redirect('/');
  },

  register: (req, res) => {
    res.render('register');
  },

  handleRegister: (req, res, next) => {
    const { username, password, password2 } = req.body;
    if (!username || !password || !password2) {
      req.flash('errorMessage', '請輸入帳號密碼');
      return next();
    }
    if (password !== password2) {
      req.flash('errorMessage', '輸入的密碼不一致');
      return next();
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        req.flash('errorMessage', err.toString());
        return next();
      }
      User.findOne({
        where: {
            username,
        },
      }).then((employee) => {
        if (employee === null || employee.account !== username) {
            employee.create({
            username,
            password: hash,
          })
            .then(() => {
              req.session.username = username;
              res.redirect('/manage');
            })
            .catch((err2) => {
              req.flash('errorMessage', err2.toString());
              return next();
            });
        } else {
          req.flash('errorMessage', '該帳戶已存在');
          return next();
        }
      });
    });
  },

  home: (req, res) => {
    res.render('index');
  },

  manage: (req, res) => {
    res.render('manage');
  },
};

module.exports = userController;