export const handler = async (event) => {
    console.log("event information ", event);
    const user = event.user || "anonym";
    const response = {
      statusCode: 200,
      body: {
        personalizedMessage: `Hey ${user}, hope you are having a great day from github test3`
      },
    };
    return response;
  };