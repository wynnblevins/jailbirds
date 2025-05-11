import puppeteer from "puppeteer";
import { createDummyPuppeteerBrowser } from "../../testUtils/mockDataGenerator";
import launchBrowser from "./browserLauncherService";

describe("launchBrowser", () => {
  const browser = createDummyPuppeteerBrowser();
  let launchSpy = null;

  beforeEach(() => {
    launchSpy = jest.spyOn(puppeteer, "launch")
      .mockImplementation(() => {    
        return Promise.resolve(browser);
      });
  });

  it("launches browser with headless flag set to true when flag isn't provided", 
    async () => {
    const actualBrowser = await launchBrowser();
    
    expect(actualBrowser).toEqual(browser);
    expect(launchSpy).toHaveBeenCalledWith({
      headless: true
    });
  });

  it("launches browser with headless flag set to false when flag is provided", 
    async () => {
    const actualBrowser = await launchBrowser(false);
    
    expect(actualBrowser).toEqual(browser);
    expect(launchSpy).toHaveBeenCalledWith({
      headless: false
    });
  });
});