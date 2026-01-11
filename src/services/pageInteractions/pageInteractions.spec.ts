import * as pageInteractionActions from "./pageInteractions";
import * as internalPageInteractions from "./htmlElementService";
import { 
  createDummyPuppeteerElementHandle, 
  createDummyPuppeteerPage 
} from "../../testUtils/mockDataGenerator";
import { Page } from "puppeteer";

import * as pageInteractions from './pageInteractions';

describe("typeInField", () => {
  it("types provided text in text field", async () => {
    const dummyFieldSelector = "dummyFieldSelector";
    const dummyText = "hello world";
    const dummyTextFieldHandle = createDummyPuppeteerElementHandle();
    const page = createDummyPuppeteerPage();
    const typeInFieldSpy = jest.spyOn(dummyTextFieldHandle, "type");
    const getHTMLElementSpy = jest.spyOn(internalPageInteractions, "getHTMLElement")
      .mockResolvedValue(dummyTextFieldHandle);
    
    await pageInteractions.typeInField(page, dummyFieldSelector, dummyText);
    
    expect(getHTMLElementSpy).toHaveBeenCalledWith(page, dummyFieldSelector);
    expect(typeInFieldSpy).toHaveBeenCalled();
  });
});

describe("clickButton", () => {
  it("clicks the button with the provided selector", async () => {
    const dummyBtnSelector = "dummyFieldSelector";
    const dummyButtonHandle = createDummyPuppeteerElementHandle();
    const page: Page = createDummyPuppeteerPage();
    const getHTMLElementSpy = jest.spyOn(internalPageInteractions, "getHTMLElement")
      .mockResolvedValue(dummyButtonHandle);
    const clickSpy = jest.spyOn(dummyButtonHandle, "click");

    await pageInteractions.clickButton(page, dummyBtnSelector);

    expect(getHTMLElementSpy).toHaveBeenCalledWith(page, dummyBtnSelector);
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe("selectFromMenu", () => {
  it("selects menu item with provided text", async () => {
    const dummyMenuSelector = "dummyMenuSelector";
    const dummySelectionHandle = createDummyPuppeteerElementHandle();
    const dummyMenuItem = "dummy menu item";
    const selectSpy = jest.spyOn(dummySelectionHandle, "select");
    const page = createDummyPuppeteerPage();
    const waitForSelectorSpy = jest.spyOn(page, "waitForSelector")
      .mockResolvedValue(dummySelectionHandle);

    await pageInteractionActions.selectFromMenu(
      page, 
      dummyMenuSelector, 
      dummyMenuItem
    )

    expect(waitForSelectorSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
  });
});