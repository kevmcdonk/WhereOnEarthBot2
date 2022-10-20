import { getBingImageUrl, getBingImageUrlById, getImageCodeById } from "../../src/services/bingImageService";
import { DailyChallengeImage } from "../../src/models/dailyChallengeImage";
import { getConfig } from "@microsoft/teamsfx";

jest.mock('teamsFx');

test("getBingImageUrl integration test", async () => {
  teamsFx.getConfig.mockResolvedValue({});
  sandbox.stub(fs, "existsSync").returns(false);

  const actual = await getBingImageUrl("Brighton");
  expect(actual).toBe(3);
});

const users = [{name: 'Bob'}];
  const resp = {data: users};
  axios.get.mockResolvedValue(resp);

  // or you could use the following depending on your use case:
  // axios.get.mockImplementation(() => Promise.resolve(resp))

  return Users.all().then(data => expect(data).toEqual(users));