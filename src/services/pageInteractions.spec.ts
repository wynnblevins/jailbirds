import * as pageInteractionActions from "./pageInteractions";
import * as internalPageInteractions from "./htmlElementService";
import { 
  createDummyPuppeteerElementHandle, 
  createDummyPuppeteerBrowser, 
  createDummyPuppeteerPage 
} from "../testUtils/mockDataGenerator";
import puppeteer, { Browser, Page } from "puppeteer";
import launchBrowser from "./browserLauncherService";

import * as pageInteractions from './pageInteractions';

describe("typeInField", () => {
  it("types provided text in text field", async () => {
    const dummyFieldSelector = "dummyFieldSelector";
    const dummyText = "hello world";
    const dummyTextFieldHandle = createDummyPuppeteerElementHandle();
    const page = createDummyPuppeteerPage();
    const getHTMLElementSpy = jest.spyOn(internalPageInteractions, "getHTMLElement")
      .mockResolvedValue(dummyTextFieldHandle);
    
    const result = await pageInteractions.typeInField(page, dummyFieldSelector, dummyText);
    
    expect(getHTMLElementSpy).toHaveBeenCalledWith(page, dummyFieldSelector);
  });
});