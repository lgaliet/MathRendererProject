const axios = require('axios');
const { S3, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3({});

module.exports.testGoogleAI = async (event) => {
  try {
    console.log(event);
    const requestBody = JSON.parse(event.body);
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=',
      {
        "contents": [
          {
            "role": "user",
            "parts": [
              requestBody
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": 'application/json'
        }
      }
    );

    const newChat = {
      question: requestBody.text,
      geminiResponse: response.data.candidates[0].content.parts[0].text
    };

    // Update the chat history in S3
    await updateS3File(newChat);

    console.log(response.data);
    return {
      statusCode: 200,
      body: JSON.stringify({ formula: response.data.candidates[0].content.parts[0].text }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from Google Gemini AI' }),
    };
  }
};

const updateS3File = async (newChat) => {
  try {
    const newFile = await getS3File();
    newFile.push(newChat);

    const putObjectParams = {
      Bucket: process.env.CHAT_HISTORY,
      Key: 'chat-history.json',
      Body: JSON.stringify(newFile),
      ContentType: 'application/json'
    };

    return await s3.send(new PutObjectCommand(putObjectParams));
  } catch (error) {
    console.error('Error updating S3 file:', error);
    const putObjectParams = {
      Bucket: process.env.CHAT_HISTORY,
      Key: 'chat-history.json',
      Body: JSON.stringify([]),
      ContentType: 'application/json'
    };

    return await s3.send(new PutObjectCommand(putObjectParams));
  }
};

const getS3File = async () => {
  const getObjectParams = {
    Bucket: process.env.CHAT_HISTORY,
    Key: 'chat-history.json',
  };

  const response = await s3.send(new GetObjectCommand(getObjectParams));
  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    response.Body.on("data", (chunk) => chunks.push(chunk));
    response.Body.on("error", reject);
    response.Body.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8").trim())
    );
  });

  return JSON.parse(body);
};

module.exports.getChatHistory = async (event) => {
  try {
    const chatHistoryFile = await getS3File();
    return {
      statusCode: 200,
      body: JSON.stringify({ history: chatHistoryFile })
    };
  } catch (error) {
    console.error('Error getting chat history:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get chat history' })
    };
  }
};

module.exports.deleteChatHistory = async (event) => {
  try {
    const deleteObjectParams = {
      Bucket: process.env.CHAT_HISTORY,
      Key: 'chat-history.json',
    };

    await s3.send(new DeleteObjectCommand(deleteObjectParams));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Chat history deleted successfully' })
    };
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete chat history' })
    };
  }
};
