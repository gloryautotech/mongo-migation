const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const PORT = process.env.PORT || 3000
var exec = require('child_process').exec
const bodyParser = require('body-parser')

let child = null

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function prepareRequestObject(req) {
  let obj = {
    from: {
      url: req.body.from.url,
      username: req.body.from.username,
      password: req.body.from.password,
    },
    to: {
      url: req.body.to.url,
      username: req.body.to.username,
      password: req.body.to.password,
    },
    operation: req.body.operation,
    isSourceAtlasLink: req.body.isSourceAtlasLink,
    isDestAtlasLink: req.body.isDestAtlasLink,
    dbName: req.body.dbName,
  }
  console.log(obj)
  return obj
}

async function connectDb(obj) {
  try {
    console.log('connecting to db.....')
    let mongoUri = null
    if (!obj.isSourceAtlasLink)
      mongoUri = `mongodb://${obj.from.username}:${obj.from.password}@${obj.from.url}:27017/`
    else {
      mongoUri = obj.from.url
    }
    console.log(mongoUri)
    // Connect to our MongoDB database hosted on MongoDB Atlas
    const client = await MongoClient.connect(mongoUri)
    const db = await client.db(obj.dbName)
    if (db) console.log('connected...')
    return db
  } catch (err) {
    console.log(err)
  }
}
// For testing purposes
// app.post('/api/mongodump', async (req, res) => {
//   try {
//     //console.log(req.body)
//     let obj = prepareRequestObject(req)
//     if (!obj.isSourceAtlasLink) {
//       let cmd =
//         'mongodump -h ' +
//         obj.from.url +
//         ' -u ' +
//         obj.from.username +
//         ' -p ' +
//         obj.from.password
//       console.log(cmd)
//       child = await exec(cmd, function (error, stdout, stderr) {
//         console.log('stdout: ' + stdout)
//         console.log('stderr: ' + stderr)
//         if (error !== null) {
//           console.log('exec error: ' + error)
//         }
//       })
//     } else {
//       //for replica set for atlas
//       let cmd = 'mongodump --uri ' + obj.from.url + ' --out ./dump'
//       console.log(cmd)
//       child = await exec(cmd, function (error, stdout, stderr) {
//         console.log('stdout: ' + stdout)
//         console.log('stderr: ' + stderr)
//         if (error !== null) {
//           console.log('exec error: ' + error)
//         }
//       })
//     }
//     // if (obj.deleteFlag) {
//     //   let db = await connectDb(obj)
//     //   await db.listCollections().toArray(function (err, collInfos) {
//     //     //console.log('colletions name : ', collInfos)
//     //     console.log('Colletions Names:')
//     //     collInfos.map(async (e) => {
//     //       console.log(JSON.stringify(e))
//     //       let result = await db.collection(e.name).drop()
//     //       console.log('Delete result :' + JSON.stringify(result))
//     //     })
//     //   })
//     // }

//     res.send({ msg: 'Mongo dump done !!' })
//   } catch (err) {
//     console.log(err)
//     res.send({ msg: 'There is some issue !!' })
//   }
// })

// app.post('/api/mongorestore', async (req, res) => {
//   try {
//     //console.log(req.body)
//     let obj = prepareRequestObject(req)
//     if (!obj.isDestAtlasLink) {
//       let cmd =
//         'mongorestore -h ' +
//         obj.to.url +
//         ' --port 27017' +
//         ' -u ' +
//         obj.to.username +
//         ' -p ' +
//         obj.to.password +
//         ' --db ' +
//         obj.dbName +
//         ' ./dump/' +
//         obj.dbName +
//         ' --authenticationDatabase=admin'
//       console.log(cmd)
//       child = await exec(cmd, function (error, stdout, stderr) {
//         console.log('stdout: ' + stdout)
//         console.log('stderr: ' + stderr)
//         if (error !== null) {
//           console.log('exec error: ' + error)
//         }
//       })
//     } else {
//       //for replica set for atlas
//       let cmd =
//         'mongorestore --uri ' +
//         obj.to.url +
//         '/' +
//         obj.dbName +
//         ' ./dump/' +
//         obj.dbName
//       console.log(cmd)
//       child = await exec(cmd)
//       console.log('after exec')
//       // cons
//     }

//     res.send({ msg: 'Mongo restore done !!' })
//   } catch (err) {
//     console.log(err)
//     res.send({ msg: 'There is some issue !!' })
//   }
// })

// app.post('/api/deleteColletion', async (req, res) => {
//   try {
//     //console.log(req.body)
//     let obj = prepareRequestObject(req)
//     if (obj.deleteFlag) {
//       let db = await connectDb(obj)
//       await db.listCollections().toArray(function (err, collInfos) {
//         //console.log('colletions name : ', collInfos)
//         console.log('Colletions Names:')
//         collInfos.map(async (e) => {
//           console.log(JSON.stringify(e))
//           let result = await db.collection(e.name).drop()
//           console.log('Delete result :' + JSON.stringify(result))
//         })
//       })
//       res.send({ msg: 'Mongo Colletion delete done !!' })
//     }
//     res.send({ msg: "deleteFlag is need's to be true", error: true })
//   } catch (err) {
//     console.log(err)
//     res.send({ msg: 'There is some issue !!' })
//   }
// })

app.post('/api/mongoScript', async (req, res) => {
  try {
    //console.log(req.body)
    let obj = prepareRequestObject(req)

    if (obj.operation == 'delete') {
      let db = await connectDb(obj)
      await db.listCollections().toArray(function (err, collInfos) {
        //console.log('colletions name : ', collInfos)
        console.log('Colletions Names:')
        collInfos.map(async (e) => {
          console.log(JSON.stringify(e))
          let result = await db.collection(e.name).drop()
          console.log('Delete result :' + JSON.stringify(result))
        })
      })
      res.send({ msg: 'Mongo Colletion deleted !!' })
    } else if (obj.operation == 'migrate') {
      if (!obj.isDestAtlasLink) {
        let cmd =
          'mongorestore -h ' +
          obj.to.url +
          ' --port 27017' +
          ' -u ' +
          obj.to.username +
          ' -p ' +
          obj.to.password +
          ' --db ' +
          obj.dbName +
          ' ./dump/' +
          obj.dbName +
          ' --authenticationDatabase=admin'
        console.log(cmd)
        child = await exec(cmd, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout)
          console.log('stderr: ' + stderr)
          if (error !== null) {
            console.log('exec error: ' + error)
          }
        })
      } else {
        //for replica set for atlas
        let cmd =
          'mongorestore --uri ' +
          obj.to.url +
          '/' +
          obj.dbName +
          ' ./dump/' +
          obj.dbName
        console.log(cmd)
        child = await exec(cmd, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout)
          console.log('stderr: ' + stderr)
          if (error !== null) {
            console.log('exec error: ' + error)
          }
        })
      }

      setTimeout(() => {
        res.send({ msg: 'Mongo restore done !!' })
      }, 5000)
    } else if (obj.operation == 'dump') {
      if (!obj.isSourceAtlasLink) {
        let cmd =
          'mongodump -h ' +
          obj.from.url +
          ' -u ' +
          obj.from.username +
          ' -p ' +
          obj.from.password
        console.log(cmd)
        child = await exec(cmd, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout)
          console.log('stderr: ' + stderr)
          if (error !== null) {
            console.log('exec error: ' + error)
          }
        })
      } else {
        //for replica set for atlas
        let cmd = 'mongodump --uri ' + obj.from.url + ' --out ./dump'
        console.log(cmd)
        child = await exec(cmd, function (error, stdout, stderr) {
          console.log('stdout: ' + stdout)
          console.log('stderr: ' + stderr)
          if (error !== null) {
            console.log('exec error: ' + error)
          }
        })
      }
      setTimeout(() => {
        res.send({ msg: 'Mongo Dump done !!', error: false })
      }, 5000)
    } else {
      res.send({ msg: 'Invalid operation selected', error: true })
    }
  } catch (err) {
    console.log(err)
    res.send({ msg: 'There is some issue !!' })
  }
})

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`)
})
