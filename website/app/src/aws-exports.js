// src/aws-exports.js
const awsconfig = {
    Auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_QQMm7ENid',
      userPoolWebClientId: '3vnb6j4mn6qhdg9c5oemnpo02j',
      mandatorySignIn: true,
      oauth: {
        enabled: false
      },
    },
  };
  
  export default awsconfig;