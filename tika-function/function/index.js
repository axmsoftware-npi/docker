const fs = require('fs');
const request = require('request');
const {Storage} = require('@google-cloud/storage');

/**
 * Responds to any allowed HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.validate = async (req, res) => {
  /**
   * HTTP Cloud Function.
   * 
   * Func analyzes a file and sends a validation result.
   * 
   * @param {string} fl The uploaded source file name to the destination bucket.
   * @param {string} bkt The destination bucket name where original file stored.
   * @param {string} metaBkt The destination bucket name to store meta data as txt.
   * 
   * 1. Takes the listed parameters from the request.
   * 
   * 2. Func works with CORS (takes an origin), responses on some methods (OPTIONS, GET, ...).
   * 
   * 3. Downloads the source file (Example: file.stl) from bkt (Storage 1) to a local file system.
   * 
   * 4. Uses Tika to analyze it (extract meta & text).
   * 
   * 5. Saves Tika data to meta file with nameAppendix (before extension, example: file-meta.stl) to metaBkt (Storage 2).
   * 
   * 6. Sends the response.
   * 
   */

  if (req.method === 'POST') {
    //const parameters
    const tikaDestinationBase = process.env.TIKA_ADDRESS;
    const tikaDestinationMeta = '/meta';
    const tikaDestinationText = '/tika';
    const tikaReturnTypes = ['application/json', 'text/plain'];
    const nameAppendix = '-meta.txt';
    const errorTextSeparator = '|';

    const storage = new Storage();
    const inputFileName = req.query.fl || req.body.fl || '';
    const inputBucketName = req.query.bkt || req.body.bkt || '';
    const outputBucketName = req.query.metaBkt || req.body.metaBkt || '';
    
    const localInputFileName = `/tmp/${inputFileName}`;
    let localOutputFileName = '';

    const downloadSourceFile = async (bucketName, inputFileName, localInputFileName) => {
      try {
        await storage.bucket(bucketName).file(inputFileName).download({
          destination: localInputFileName
        });
        console.log(`downloadFile: success to ${localInputFileName}`);
      } catch (err) {
        throw new Error(`12${errorTextSeparator}File download failed: ${err}. File ${bucketName}/${inputFileName}`);
      }
    }

    const requestTika = (localFileAddress, detectionType, returnFormat) => {
      try {
        return new Promise((resolve, reject) => {
          const tikaRequestOptions = {
            url: tikaDestinationBase + detectionType,
            headers: {
              'Accept': returnFormat
            }
        };
          fs.createReadStream(localFileAddress).pipe(
            request.put(tikaRequestOptions, function (error, response, body) {
              const res = {
                ok: '',
                no: ''
              };
              if (!error && response) {
                if (response.statusCode > 199 && response.statusCode < 299) {
                  console.log(`requestTika: success at ${tikaRequestOptions.url}.`);
                  res.ok = body;
                } else {
                  console.log(`requestTika: fail at ${tikaRequestOptions.url}.`);
                  res.no = (detectionType === tikaDestinationMeta 
                    ? `22${errorTextSeparator}Tika meta error: `
                    : `23${errorTextSeparator}Tika text error: `)
                    + response.statusMessage;
                }
              } else {
                console.log(`requestTika: fail at ${tikaRequestOptions.url}, returnFormat: ${returnFormat}.`);
                res.no = error;
              }
              resolve(res);
            })
          );
        });
      }
      catch (err) {
        throw new Error(`21${errorTextSeparator}Tika connection error: ${err.message}`);
      }
    }

    //Tika external
    const getFileInfo = async (fileLocalAddress) => {
      //create the array of parameters to make the array of parallel promises
      const requestParams = [
        [fileLocalAddress, tikaDestinationMeta, tikaReturnTypes[0]],
        [fileLocalAddress, tikaDestinationText, tikaReturnTypes[1]],
      ]
      const promises = requestParams.map(requestParam => requestTika(requestParam[0], requestParam[1], requestParam[2]));
      const result = [];

      //wait for all promises resolve
      for (const timeoutPromise of promises) {
        result.push(await timeoutPromise)
      }

      //prepare result
      return {
        meta: result[0].ok,
        metaError: result[0].no,
        text: result[1].ok,
        textError: result[1].no,
      };
    }

/*
//Tika local
    const getFileInfo = async (fileLocalAddress) => {
      const data = {
        text: '',
        meta: '',
        type: '',
      };
      try {
        tika.extract(fileLocalAddress, function (err, text, meta) {
          //console.log(text); // Logs 'Just some text'.
          data.text = text;
          //console.log(meta.producer[0]); // Logs 'LibreOffice 4.1'.
          data.meta = meta.producer[0];
        });
        tika.type(fileLocalAddress, function (err, contentType) {
          //console.log(contentType); // Logs 'application/pdf'.
          data.type = contentType;
        });

        return data;
      }
      catch (err) {
        throw new Error(`23${errorTextSeparator}Tika error: ${err}.`);
      }
    }
*/
    const createOutputLocalFile = (localOutputFileName, data) => {
    //create/overwrite file locally
      return new Promise((resolve, reject) => {
        fs.writeFile(localOutputFileName, data, function (err) {
          if (err) {
            throw new Error(`32${errorTextSeparator}Local file crearion: ${err}.`);
          }
          resolve();
        });
      });
    }

    const uploadResultFile = async (bucketName, localOutputFileName, destFileName) => {
      try {
      // Uploads a local file to the bucket
        await storage.bucket(bucketName).upload(localOutputFileName, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
          // Enable long-lived HTTP caching headers
          // Use only if the contents of the file will never change
          // (If the contents will change, use cacheControl: 'no-cache')
          cacheControl: 'public, max-age=31536000',
        },
          destination: destFileName
      });
        console.log(`${destFileName} uploaded to ${bucketName}.`);
      } catch (err) {
        throw new Error(`41${errorTextSeparator}Unable to upload meta file ${DestFileName} to ${bucketName}: ${err}.`);
      }
    }

    const parseWarning = (dataError, response) => {
      const errorParts = dataError.split(errorTextSeparator);
      response.code += errorParts[0];
      response.message += errorParts[1]+'. ';
    }

    try {
      //check for required input parameters:
      if (!(inputFileName && inputBucketName && outputBucketName)) {
        throw new Error(`11${errorTextSeparator}Missing input parameters! All parameters are mandatory.`);
      }
      //download the file from Storage 1
      await downloadSourceFile(inputBucketName, inputFileName, localInputFileName);

      //main work with the file
      const metaData = await getFileInfo(localInputFileName);

      //use meta data to create response, form the meta
      const response = {};

      if (metaData.text && metaData.meta) {
        //create resulting meta file
        //create new name
        const outputFileName = inputFileName + nameAppendix;
        localOutputFileName = `/tmp/${outputFileName}`;
  
        //save text file for upload
        await createOutputLocalFile(localOutputFileName, metaData.text);
  
        //save resulting file
        await uploadResultFile(outputBucketName, localOutputFileName, outputFileName);
  
        response.status = 0;
        //use meta data to create file, form the response
        response.metaLink = `gs://${outputBucketName}/${outputFileName}`;

        metaData.meta = JSON.parse(metaData.meta);
        response.language = metaData.meta.language;
      } else {
        response.code = '';
        response.type = 'WARNING';
        response.message = '';
        if (metaData.textError) {
          parseWarning(metaData.textError, response);
        }
  
        if (metaData.metaError) {
          parseWarning(metaData.metaError, response);
        }
      }

      res.status(200).send(response);
    }
    catch (err) {
      const errMessageParts = err.message.split(errorTextSeparator);
      const error = {
        code: errMessageParts[0],
        type: 'ERROR',
        message: errMessageParts[1]
      }
      res.status(400).send(error);
    }
    finally {
      // Delete the temporary files.
      fs.unlinkSync(localInputFileName);
      if (localOutputFileName) {
        fs.unlinkSync(localOutputFileName);
      }
    }
  } else {
    const error = {
      code: 1,
      type: 'ERROR',
      message: 'Method is not allowed!'
    }
    res.status(403).send(error);
  }
};
