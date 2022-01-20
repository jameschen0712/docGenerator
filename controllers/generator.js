var fs = require('fs');
var path = require('path');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const DocxMerger = require('docx-merger');
var builder = require('docx-builder');
var docx = new builder.Document();
const db = require('../models');
var pg = require('pg');
var config = {
    user: "postgres",
    database: "doc_generator",
    password: "xp22710249",
    port: 5432,
    // 擴充套件屬性
    max: 20, // 連線池最大連線數
    idleTimeoutMillis: 3000, // 連線最大空閒時間 3s
}
var pool = new pg.Pool(config);

const job_title_arr = ['總經理', '副總經理', '協理', '研發經理', '經理', '高級資深工程師', '資深工程師', '系統工程師', '前端工程師', '財務會計經理', '會計'];


const generatorController = {
    generatorIndex: (req, res) => {
        var sql = 'SELECT uid, name FROM employee WHERE uid != 1 AND state = true ORDER BY job_title ASC';
        // Async & Await 方式（需 node ^7.2.1，執行時使用 node --harmony-async-await index.js）
        var query = async () => { 
            // 同步建立連線
            var connect = await pool.connect()
            try {
            // 同步等待結果
            var result = await connect.query(sql)
            console.log(result.rows[0]) // 可以通過rows遍歷資料
            res.render("doc_generator",{'result': result});
            } finally {
            connect.release()
            }
            }
            // 非同步進行資料庫處理
            query().catch(e => console.error(e.message, e.stack)); 
    },

    setEmployee: (req, res) => {
        var arr = [];
        var now_fin = 0;
        var all_fin = 3;//要等待的query 數量
        var employees = {select_employee:[],employee_num:0,select_employee_class:[]};
        // for (const key in req.body) {
        //     select_employee[select_employee.length] = req.body['select_employee'];
        // }
        select_employee = req.body['select_employee'];
        console.log("test = "+JSON.stringify(req.body));
        var i = 0;
        for (const key in req.body.select_employee_class) {
            //console.log(key, req.body[key]);
            console.log("req.body.select_employee_class["+key+"] = "+req.body.select_employee_class[key]);
            if(req.body.select_employee_class[key] != "")
            {
                employees.employee_num++;
                employees.select_employee[i] = req.body.select_employee_uid[key];
                employees.select_employee_class[i] = req.body.select_employee_class[key];
                i++;
            }
         }
        console.log("employees = "+JSON.stringify(employees));
        //console.log("employee_num = "+employees.employee_num);
        //console.log('exportWord-------------' + req.body.select_employee);
        if (employees.employee_num === 0) {
            console.log("true");
            req.flash('errorMessage', '請勾選人員');
            return res.redirect('/generator');
        }
        else
        {
            var query_uid_arr = [], order_uid_arr = [];
            var min_class = Math.min(...employees.select_employee_class);
            var max_class = Math.max(...employees.select_employee_class);
            for(let now_class = min_class ; now_class <= max_class ; now_class++)
            {
                for(let i = 0 ; i < employees.select_employee_class.length ; i++)
                {
                    if(employees.select_employee_class[i] == now_class)
                    {
                        if(now_class < 4)
                            order_uid_arr.push(employees.select_employee[i]);
                        query_uid_arr.push(employees.select_employee[i]);
                    }
                }
            }
            //query db
            var sql_uid = query_uid_arr.join(','),sql_order = 'ORDER BY CASE ';
            for(let i = 0 ; i < order_uid_arr.length ; i++)
            {
                sql_order += "WHEN uid = "+order_uid_arr[i]+" THEN "+(i+1)+" ";
            }
            sql_order += 'ELSE uid END ASC';
            var sql = 'SELECT * FROM employee WHERE uid in ('+sql_uid+') '+ sql_order;
            var sql_exp = 'SELECT * FROM experience WHERE uid in ('+sql_uid+')';
            var sql_pro = 'SELECT * FROM project WHERE uid in ('+sql_uid+')';
            var result, data = [], project = [], exp = [], result_pro, result_exp, project_str;
            console.log(sql);

            function Wait(type, obj) {
                if(now_fin == all_fin-1)
                {
                    console.log('result ============================================== '+JSON.stringify(result.rows));
                    console.log('pro ============================================== '+JSON.stringify(result_pro.rows));
                    console.log('exp ============================================== '+JSON.stringify(result_exp.rows));
                    console.log("finished");
                    now_fin = 0;
                    for(let i = 0 ; i < result.rowCount ; i++)
                    {
                            let uid = result.rows[i].uid;
                            let sex = (result.rows[i].sex) ? "女" : "男";
                            let type = employees.select_employee_class[employees.select_employee.indexOf(result.rows[i].uid.toString())];
                            let date = new Date(result.rows[i].birthday);
                            let currentYear = date.getFullYear() - 1911;
                            //console.log("employees.select_employee.indexOf(result.rows["+key+"].uid) = "+employees.select_employee.indexOf(result.rows[key].uid.toString()));
                            //console.log("result.rows["+key+"].uid = "+result.rows[key].uid);
                            let type1 = '計畫主持人';
                            let type2 = '協同主持人';
                            let type3 = '專案經理';
                            let type4 = '工程師';
                            switch(type){
                                case '1':
                                    type1 = "■"+type1; type2 = "□"+type2; type3 = "□"+type3; type4 = "□"+type4;
                                break;

                                case '2':
                                    type1 = "□"+type1; type2 = "■"+type2; type3 = "□"+type3; type4 = "□"+type4;
                                break;

                                case '3':
                                    type1 = "□"+type1; type2 = "□"+type2; type3 = "■"+type3; type4 = "□"+type4;
                                break;

                                case '4':
                                    type1 = "□"+type1; type2 = "□"+type2; type3 = "□"+type3; type4 = "■"+type4;
                                break;
                                default:
                                    console.log("error");
                                break;
                            }

                            /* set default value */
                            project = [];
                            exp = [];
                            project_str = "";
                            /* set default value */


                            /*start 組成project*/
                            for(let j = 0, count = 0 ; j < result_pro.rowCount ; j++)
                            {
                                if(result_pro.rows[j].uid == uid)
                                {
                                    project[count] = {};
                                    project[count].project_name = result_pro.rows[j].project_name
                                    project[count].project_company = result_pro.rows[j].project_company
                                    var start_year = new Date(result_pro.rows[j].start_year).getFullYear()-1911;
                                    var end_year = new Date(result_pro.rows[j].end_year).getFullYear()-1911;
                                    //console.log("start_year = "+start_year);
                                    //console.log("end_year = "+end_year);
                                    start_year = parseInt(start_year);
                                    end_year = parseInt(end_year);
                                    var year = '('+start_year+'年';
                                    for(start_year = start_year+1 ; start_year <= end_year ; start_year++)
                                    {
                                        year += '、'+start_year+'年';
                                    }
                                    year += ')';
                                    project[count].year = year;
                                    if(count >= 9)
                                        project_str += (count+1)+'.  '+project[count].project_company+'：'+project[count].project_name+year+'\n';
                                    else
                                        project_str += (count+1)+'.   '+project[count].project_company+'：'+project[count].project_name+year+'\n';
                                    count++;
                                }
                            }
                            /*end 組成project*/


                            /*start 組成experience*/ 
                            for(let j = 0, count = 0 ; j < result_exp.rowCount ; j++)
                            {
                                if(result_exp.rows[j].uid == uid)
                                {
                                    exp[count] = {};
                                    exp[count].company_name = result_exp.rows[j].company_name
                                    exp[count].ex_job_title = result_exp.rows[j].job_title
                                    if(result_exp.rows[j].is_now)
                                        exp[count].mon = new Date(result_exp.rows[j].start_mon).getFullYear()+'/'+(new Date(result_exp.rows[j].start_mon).getMonth()+1) + '~' + '迄今';
                                    else{
                                        exp[count].mon = new Date(result_exp.rows[j].start_mon).getFullYear()+'/'+(new Date(result_exp.rows[j].start_mon).getMonth()+1) 
                                        + '~' + new Date(result_exp.rows[j].end_mon).getFullYear()+'/'+(new Date(result_exp.rows[j].end_mon).getMonth()+1);
                                    }
                                    count++;
                                }
                            }
                            /*end 組成experience*/ 

                            /*start 組成 data */
                            data[i] = {
                                    name: result.rows[i].name,
                                    type1: type1,
                                    type2: type2,
                                    type3: type3,
                                    type4: type4,
                                    english_name: result.rows[i].english_name,
                                    sex: sex,
                                    birthday: currentYear,
                                    ID_number: result.rows[i].id_number,
                                    address: result.rows[i].address,
                                    tel: result.rows[i].tel,
                                    education: result.rows[i].education,
                                    expertise: result.rows[i].expertise,
                                    job_title: job_title_arr[result.rows[i].job_title],
                                    exp: exp,
                                    project: project_str,
                                };  
                            /*end 組成 data */
                            //console.log("project["+i+"] = "+JSON.stringify(project));
                            //console.log("exp["+i+"] = "+JSON.stringify(exp));
                    }


                    const content = fs.readFileSync(
                        path.resolve(__dirname, "template_new.docx"),
                        "binary"
                    );
            
                    const zip = new PizZip(content);
            
                    const doc = new Docxtemplater(zip, {
                        paragraphLoop: true,
                        linebreaks: true,
                    });
                    doc.render({ data });
                    const buf = doc.getZip().generate({ type: "nodebuffer" });
                    fs.writeFileSync(path.resolve(__dirname, "output.docx"), buf);
                    res.download(path.resolve(__dirname, "output.docx"));
                    //console.log("final result ========== "+JSON.stringify(data));
                }
                else
                    now_fin++;
            }            

            
            // Async & Await 方式（需 node ^7.2.1，執行時使用 node --harmony-async-await index.js）
            var query = async () => { 
                // 同步建立連線
                var connect = await pool.connect()
                try {
                // 同步等待結果
                    result = await connect.query(sql)
                    //console.log(result.rows) // 可以通過rows遍歷資料
                } 
                finally { 
                    Wait(0, result.rows);
                }   
            }
            query().catch(e => console.error(e.message, e.stack)); 
            var query = async () => { 
                // 同步建立連線
                var connect = await pool.connect()
                try {
                // 同步等待結果
                    result_exp = await connect.query(sql_exp)
                    //console.log(result.rows) // 可以通過rows遍歷資料
                } 
                finally { 
                    Wait(1, result_exp.rows);
                }   
            }
                // 非同步進行資料庫處理
            query().catch(e => console.error(e.message, e.stack)); 
            var query = async () => { 
                    // 同步建立連線
                    var connect = await pool.connect()
                    try {
                    // 同步等待結果
                        result_pro = await connect.query(sql_pro)
                        //console.log(result.rows) // 可以通過rows遍歷資料
                    } 
                    finally { 
                        Wait(2, result_pro.rows);
                    }   
                }
                    // 非同步進行資料庫處理
                query().catch(e => console.error(e.message, e.stack)); 
            //export docx

            console.log("false");
            
        }
    },

    chooseEmployee: (req, res) => {
        console("req = "+req);
        res.render('doc_generator', {'result': req});
    }
};
module.exports = generatorController;
