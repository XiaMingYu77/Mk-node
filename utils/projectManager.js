const ProjectStatusMap = {
  Setting: '0',
  Publishing: '1',
  Deleted: '2',
}

function getProject(db, projectId){
  return new Promise((resolve, reject)=>{
    const sql = 'SELECT * FROM Project WHERE projectId = ?';
    db.query(sql, [projectId], (error, results)=>{
      if(error) return reject(error);
      if (results && results[0]) return resolve(results[0]);
      else return reject();
    })
  })
}

function getLatestProject(db){
  return new Promise((resolve, reject)=>{
    const sql = 'SELECT * FROM Project ORDER BY createTime DESC LIMIT 1;'
    db.query(sql, (error, results)=>{
      if(error) return reject(error);
      if (results[0]) return resolve(results[0]);
      else return reject();
    })
  })
}

function createProject(db, { projectName, picUrl, jsonData, userId, status=ProjectStatusMap.Setting }){
  return new Promise((resolve, reject)=>{
    const sql = 'INSERT INTO Project (name, coverPic, status, jsonData, userId, createTime, updateTime) VALUES (?, ?, ?, ?, ?, NOW(), NOW());';
    db.query(sql, [projectName, picUrl, status, jsonData, userId], async (error) => {
      if(error) return reject(error);
      const projectData = await getLatestProject(db);
      return resolve(projectData);
    })
  })
}

function updateProject(db, { projectId, projectName, picUrl, jsonData, status=ProjectStatusMap.Setting }){
  const updateFields = {};
  
  if (projectName) {
    updateFields.name = projectName;
  }
  if (picUrl) {
    updateFields.coverPic = picUrl;
  }
  if (status) {
    updateFields.status = status;
  }
  if (jsonData) {
    updateFields.jsonData = jsonData;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new Error('没有需要更新的字段');
  }

  return new Promise((resolve, reject)=>{
    const sql = 'UPDATE Project SET ? WHERE projectId = ?;';
    db.query(sql, [updateFields, projectId], async (error, result) => {
      if(error) return reject(error);
      if (result.affectedRows === 0) {
        return reject(new Error('未找到匹配的项目，更新失败'));
      }
      const projectData = await getLatestProject(db);
      return resolve(projectData);
    })
  })
}

function getTotal(db, searchStr){
  const sql = `SELECT COUNT(*) as total_count FROM Project where ${searchStr}`;
  return new Promise((resolve, reject)=>{
    db.query(sql, async (error, result) => {
      if(error) return reject(error);
      resolve(result[0].total_count);
    })
  })
}
function getProjectList(db, searchObj, pageSize, pageNumber){
  let searchStr = '';
  if(searchObj) {
    for (const key in searchObj) {
      searchStr += searchStr ? ` AND ${key} = ${searchObj[key]} ` : ` ${key} = ${searchObj[key]} `
    }
  }
  // 按照更新时间降序排列，分页
  const sql = `select projectId,name,coverPic,createTime,status,userId,updateTime from Project where ${searchStr} order by updateTime DESC limit ?, ?;`
  return new Promise((resolve, reject)=>{
    db.query(sql, [pageNumber*pageSize, pageSize], async (error, result) => {
      if(error) return reject(error);
      const total = await getTotal(db, searchStr);
      resolve({
        total,
        projectList: result
      });
    });
  })
}

module.exports = {
  ProjectStatusMap,
  createProject,
  updateProject,
  getProject,
  getProjectList
}