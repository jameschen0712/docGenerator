const db = require('../models');
const saltRounds = 10;
const bcrypt = require('bcrypt');


const Employee = db.sequelize.define('employee', {
    uid: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: db.Sequelize.STRING,
    },
    english_name: {
        type: db.Sequelize.STRING,
    },
    sex: {
        type: db.Sequelize.STRING,
    },
    birthday: {
        type: db.Sequelize.DATE,
    },
    id_number: {
        type: db.Sequelize.STRING
    },
    tel: {
      type: db.Sequelize.STRING
    },
    job_title: {
      type: db.Sequelize.STRING
    },
    start_day: {
      type: db.Sequelize.DATE
    },
    education: {
      type: db.Sequelize.STRING
    },
    address: {
      type: db.Sequelize.STRING
    },
    expertise: {
      type: db.Sequelize.STRING
    },
    state: {
      type: db.Sequelize.BOOLEAN
    },
    account: {
      type: db.Sequelize.STRING
    },
    pwd: {
      type: db.Sequelize.STRING
    }
    // Model 的屬性都是定義在這裡
  }, {
    freezeTableName: true
    // 其它的 model 選項填寫在這裡
  });

const Project = db.sequelize.define('project', {
    pid: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uid: {
      type: db.Sequelize.INTEGER,
    },
    project_company: {
      type: db.Sequelize.STRING,
    },
    project_name: {
      type: db.Sequelize.STRING,
    },
    start_year: {
      type: db.Sequelize.DATE
    },
    end_year: {
      type: db.Sequelize.DATE
    }
    // Model 的屬性都是定義在這裡
  }, {
    freezeTableName: true
    // 其它的 model 選項填寫在這裡
  });

const Experience = db.sequelize.define('experience', {
    eid: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uid: {
      type: db.Sequelize.INTEGER,
    },
    company_name: {
      type: db.Sequelize.STRING,
    },
    job_title: {
      type: db.Sequelize.STRING,
    },
    start_mon: {
      type: db.Sequelize.DATE,
    },
    end_mon: {
      type: db.Sequelize.DATE,
    },
    is_now:{
      type: db.Sequelize.BOOLEAN,
    }
    // Model 的屬性都是定義在這裡
  }, {
    freezeTableName: true
    // 其它的 model 選項填寫在這裡
  });
  

const job_title_arr = ['總經理', '副總經理', '協理', '研發經理', '經理', '高級資深工程師', '資深工程師', '系統工程師', '前端工程師', '財務會計經理', '會計'];

const employeeController = {
    employee: (req, res) => {
    Employee.findAll({
      where: {uid: {[db.Sequelize.Op.ne]: '1'}},
      attributes: ['uid', 'sex', 'english_name', 'name', 'job_title'],
    })
      .then(employee => res.render('employee', { employee }))
      .catch((err) => {
        console.log(err);
        return res.send('網頁維修中');
      });
  },

  manageEmployee: (req, res) => {
    // if (!req.session.username) return res.redirect('/login');
    Employee.findAll({
      where: {uid: {[db.Sequelize.Op.ne]: '1'}},
      attributes: ['uid', 'name', 'english_name', 'sex', 'birthday', 'id_number', 'tel', 'job_title', 'start_day', 'education', 'address', 'expertise'],
      order: [['job_title', 'ASC'],],
    })
      .then(employee => {
          if(employee.length > 0)
          {
            res.render('manage_employee', { employee })
          }
          else
          res.render('/manage/employee/add')})
      .catch((err) => {
        console.log(err);
        res.redirect('/');
      });
  },

  add: (req, res) => res.render('manage_employee_add'),

  handleAdd: (req, res) => {
    const {
      name, english_name, sex, birthday, id_number, tel, job_title, start_day, education, address, expertise
    } = req.body;
    const {company_name, ex_job_title, ex_start_mon, ex_end_mon} = req.body;
    const {project_company, project_name, start_year, end_year} = req.body;
    const state = 1;
    const pwd = '000000';
    var new_uid = 0;
    if (name === '' || english_name === '' || sex === '' 
    || birthday === '' || id_number === '' || tel === '' || job_title === '' 
    || start_day === '' || education === '' || address === '' || expertise === '') {
      req.flash('errorMessage', '資料未輸入完全');
      return res.redirect('/manage/employee/add');
    }
    console.log("JSON = "+JSON.stringify(req.body));
    bcrypt.hash(pwd, saltRounds, (err, hash) => {
      Employee.create({
        name: name, english_name: english_name, sex: sex, birthday: birthday,
        id_number: id_number, tel: tel, job_title: job_title, start_day: start_day,
        education: education, address: address, expertise: expertise, state: state,
        account: id_number, pwd: hash
      })
        .then(() => {
                /* 找最新uid */ 
                Employee.max('uid',{
                  where: {uid: {[db.Sequelize.Op.ne]: '1'}},
                })
                /* 寫入 project */ 
                  .then(employee => {
                        new_uid = employee;
                        console.log('ans = '+ex_start_mon[0]);
                        let today = new Date();
                        console.log('req.body = '+JSON.stringify(req.body));
                        for(let i = 0 ; i < company_name.length ; i++)
                        {
                          Experience.create({
                            uid: new_uid, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon[i-1], is_now: (i == 0) ? true : false
                          })
                          /* 寫入 Experience */ 
                          .then(() => {
                                console.log("insert Experience success");
                                if(i == company_name.length-1)
                                {
                                  for(let j = 0 ; j < project_company.length ; j++)
                                  {
                                    Project.create({
                                    uid: new_uid, project_company: project_company[j], project_name: project_name[j], start_year: start_year[j], end_year: end_year[j]
                                    })
                                    .then(() => {console.log("insert Project success");})
                                    .catch((err) => {console.log("insert Project err = "+err);})
                                  }
                                }
                          })
                        .catch((err) => {
                          console.log("get employee max uid or insert Experience err = "+err);
                        });
                        }
                      if(company_name.length == 0)
                      {
                        for(let j = 0 ; j < project_company.length ; j++)
                                  {
                                    Project.create({
                                    uid: new_uid, project_company: project_company[j], project_name: project_name[j], start_year: start_year[j], end_year: end_year[j]
                                    })
                                    .then(() => {console.log("insert Project success");})
                                    .catch((err) => {console.log("insert Project err = "+err);})
                                  }
                      }
                  console.log('add successfully');
                  return res.redirect('/manage/employee');
                  })
        })
        .catch((err) => {console.log(err)});
    });
  },

  edit: (req, res, next) => {
    Employee.findByPk(req.params.id)
      .then(employee => {
            Project.findAll({
              where: {uid:  req.params.id},
            })
            .then(project => {
                  Experience.findAll({
                    where: {uid:  req.params.id},
                  })
                  .then(experience => {
                    res.render('manage_employee_edit', { employee, project, experience });
                  })
                  .catch((err) => {
                    console.log(err);
                    return next();
                  });
            })
            .catch((err) => {
              console.log(err);
              return next();
            });
      })
      .catch((err) => {
        console.log(err);
        return next();
      });
  },

  handleEdit: (req, res) => {
    console.log("===================================handleEdit===================================");
    const {
      name, english_name, sex, birthday, id_number, tel, job_title, start_day, education, address, expertise,
    } = req.body;
    if (name === '' || english_name === '' || sex === '' 
    || birthday === '' || id_number === '' || tel === '' || job_title === '' 
    || start_day === '' || education === '' || address === '' || expertise === '') {
      req.flash('errorMessage', '資料未輸入完全');
      return res.redirect(`/manage/employee/edit/${req.params.id}`);
    }
    let today = new Date();
    Employee.findByPk(req.params.id)
      .then((employee) => {
        employee
          .update({
            name: name, english_name: english_name, sex: sex, birthday: birthday,
            id_number: id_number, tel: tel, job_title: job_title, start_day: start_day,
            education: education, address: address, expertise: expertise
          })
          .then(() => {
                /* findAll experience */
                /* findAll experience */
                /* findAll experience */
                Experience.findAll({
                  where: {uid:  req.params.id},
                })
                .then((experience) => {
                  console.log("experience.length = "+experience.length);
                  console.log("experience = "+JSON.stringify(experience));
                  const {company_name, ex_job_title, ex_start_mon, ex_end_mon} = req.body;
                  /* delete experience */
                  if(experience.length !== 0)
                  {
                    for(let x = 0 ; x < experience.length ; x++)
                    {
                      if(x < experience.length - 1)
                        experience[x].destroy({where: {uid:  req.params.id}})
                      else {
                        experience[x].destroy({where: {uid:  req.params.id}})
                        /* 寫入 Experience */ 
                        .then(() => {
                              console.log("typeof(company_name) = "+typeof(company_name));
                              console.log("insert Experience success");
                              if(typeof(company_name) === 'string')
                              {
                                Experience.create({
                                      uid: req.params.id, company_name: company_name, job_title: ex_job_title, start_mon: ex_start_mon, end_mon:  today, is_now: true
                                })
                                  .then(() => {console.log("insert Experience success string");})
                                  .catch((err) => {console.log("insert Experience err = "+err);})
                              } 
                              else
                              {
                                for(let i = 0 ; i < company_name.length ; i++)
                                {
                                  if(i < experience.length - 1)
                                  {
                                    console.log("Length!!!!!!!!!!!!!!!!!! = "+Array.isArray(ex_end_mon));
                                    console.log("Length!!!!!!!!!!!!!!!!!! = "+ex_end_mon);
                                      Experience.create({
                                          uid: req.params.id, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon[i-1], is_now: (i == 0) ? true : false
                                      })
                                  }
                                  else{
                                    if(Array.isArray(ex_end_mon))
                                    {
                                        Experience.create({
                                            uid: req.params.id, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon[i-1], is_now: (i == 0) ? true : false
                                        })
                                        .then(() => {console.log("insert Experience success array");})
                                        .catch((err) => {console.log("insert Experience err = "+err);})
                                    }
                                      else
                                    {
                                        Experience.create({
                                            uid: req.params.id, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon, is_now: (i == 0) ? true : false
                                      })
                                        .then(() => {console.log("insert Experience success string date");})
                                        .catch((err) => {console.log("insert Experience err = "+err);})
                                    }
                                    
                                  }
                                } 
                              }
                        })
                        .catch((err) => {
                          console.log("get employee max uid or insert Experience err = "+err);
                        });
                      }
                    }
                  }
                  else{
                        console.log("typeof(company_name) = "+typeof(company_name));
                        console.log("insert Experience success");
                        if(typeof(company_name) === 'string')
                        {
                          Experience.create({
                                uid: req.params.id, company_name: company_name, job_title: ex_job_title, start_mon: ex_start_mon, end_mon:  today, is_now: true
                          })
                            .then(() => {console.log("insert Experience success string");})
                            .catch((err) => {console.log("insert Experience err = "+err);})
                        } 
                        else
                        {
                          for(let i = 0 ; i < company_name.length ; i++)
                          {
                            if(i < experience.length - 1)
                            Experience.create({
                                  uid: req.params.id, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon[i-1], is_now: (i == 0) ? true : false
                            })
                            else{
                              Experience.create({
                                uid: req.params.id, company_name: company_name[i], job_title: ex_job_title[i], start_mon: ex_start_mon[i], end_mon:  (i == 0) ? today : ex_end_mon[i-1], is_now: (i == 0) ? true : false
                              })
                              .then(() => {console.log("insert Experience success array");})
                              .catch((err) => {console.log("insert Experience err = "+err);})
                            }
                          } 
                        }
                  }
                })
                .catch((err)=>{console.log("Experience findAll error = "+err)});
                /* experience end */
                /* experience end */
                /* experience end */
                /* findAll project */
                /* findAll project */
                /* findAll project */
                Project.findAll({
                  where: {uid:  req.params.id},
                })
                .then((project) => {
                  console.log("project.length = "+project.length);
                  console.log("project = "+JSON.stringify(project));
                  const {project_company, project_name, start_year, end_year} = req.body;
                  /* delete project */
                  if(project.length !== 0)
                  {
                    for(let x = 0 ; x < project.length ; x++)
                    {
                      if(x < project.length - 1)
                      project[x].destroy({where: {uid:  req.params.id}})
                      else {
                        project[x].destroy({where: {uid:  req.params.id}})
                        /* 寫入 project */ 
                        .then(() => {
                              console.log("typeof(project_company) = "+typeof(project_company));
                              console.log("insert project success");
                              if(typeof(project_company) === 'string')
                              {
                                Project.create({
                                      uid: req.params.id, project_company: project_company, project_name: project_name, start_year: start_year, end_year:  end_year
                                })
                                  .then(() => {console.log("insert project success string");})
                                  .catch((err) => {console.log("insert project err = "+err);})
                              } 
                              else
                              {
                                for(let i = 0 ; i < project_company.length ; i++)
                                {
                                  if(i < project.length - 1)
                                  Project.create({
                                      uid: req.params.id, project_company: project_company[i], project_name: project_name[i], start_year: start_year[i], end_year:  end_year[i]
                                  })
                                  else{
                                    Project.create({
                                      uid: req.params.id, project_company: project_company[i], project_name: project_name[i], start_year: start_year[i], end_year:  end_year[i]
                                    })
                                    .then(() => {console.log("insert project success array");})
                                    .catch((err) => {console.log("insert project err = "+err);})
                                  }
                                } 
                              }
                        })
                        .catch((err) => {
                          console.log("get employee max uid or insert project err = "+err);
                        });
                      }
                    }
                  }
                  else{
                        console.log("typeof(project_company) = "+typeof(project_company));
                        console.log("insert project success");
                        if(typeof(project_company) === 'string')
                        {
                          Project.create({
                              uid: req.params.id, project_company: project_company, project_name: project_name, start_year: start_year, end_year:  end_year
                          })
                            .then(() => {console.log("insert project success string");})
                            .catch((err) => {console.log("insert project err = "+err);})
                        } 
                        else
                        {
                          for(let i = 0 ; i < project_company.length ; i++)
                          {
                            if(i < project.length - 1)
                            Project.create({
                              uid: req.params.id, project_company: project_company[i], project_name: project_name[i], start_year: start_year[i], end_year:  end_year[i]
                            })
                            else{
                              Project.create({
                                uid: req.params.id, project_company: project_company[i], project_name: project_name[i], start_year: start_year[i], end_year:  end_year[i]
                              })
                              .then(() => {console.log("insert project success array");})
                              .catch((err) => {console.log("insert project err = "+err);})
                            }
                          } 
                        }
                  }
                })
                .catch((err)=>{console.log("project findAll error = "+err)});
                /* project end */
                /* project end */
                /* project end */
                console.log('update successfully');
                return res.redirect('/manage/employee');
          })
          .catch((err) => {
            if (err.original.errno === 1062) {
              req.flash('errorMessage', '順序不可重複');
              return res.redirect(`/manage/employee/edit/${req.params.id}`);
            }
          });
      })
      .catch((err) => {
        console.log(err);
        return res.redirect(`/manage/employee/edit/${req.params.id}`);
      });
  },

  delete: (req, res) => {
    Employee.findByPk(req.body.id)
      .then((employee) => {
        console.log('delete successfully');
        employee.destroy();
        return res.redirect('/manage/employee');
      })
      .catch((err) => {
        console.log(err);
        return res.redirect('/manage/employee');
      });
  },
};

module.exports = employeeController;