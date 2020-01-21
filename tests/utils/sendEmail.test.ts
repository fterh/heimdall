import path from "path";
import * as AWSMock from "aws-sdk-mock";
import sendEmail from "../../lib/utils/sendEmail";

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore();
});

it("should call SESV2's sendEmail method", async () => {
  const spy = jest.fn();
  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    spy(params);
    callback(null, null);
  });

  await sendEmail({
    from: "fromAddress",
    to: ["toAddress"],
    subject: "subject",
    body: "body"
  });

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith({
    FromEmailAddress: "fromAddress",
    Destination: {
      ToAddresses: ["toAddress"]
    },
    Content: {
      Simple: {
        Subject: {
          Data: "subject"
        },
        Body: {
          Text: {
            Data: "body"
          }
        }
      }
    }
  });
});
