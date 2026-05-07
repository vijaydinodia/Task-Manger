const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dqfhn7rw3",
  api_key: "382695276612379",
  api_secret: "3XWIpGNiRSe2K2Cs2t9-fUtPPY0",
});

exports.uploadImage = async (files) => {
  const fileArray = Array.isArray(files) ? files : Object.values(files);
  const results = [];

  // Upload each file one by one
  for (const file of fileArray) {
    try {
      const result = await new Promise((resolve, reject) => {
        // Upload the file to Cloudinary
        cloudinary.uploader
          .upload_stream({ folder: "task-manager/tasks" }, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          })
          .end(file.buffer || file.data);
      });

      results.push(result);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  return results;
};
