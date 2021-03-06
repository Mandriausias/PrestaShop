require('module-alias/register');
const BOBasePage = require('@pages/BO/BObasePage');

class Countries extends BOBasePage {
  constructor() {
    super();

    this.pageTitle = 'Countries •';

    // Selectors
    // Header selectors
    this.addNewCountryButton = '#page-header-desc-country-new_country';

    // Form selectors
    this.gridForm = '#form-country';
    this.gridTableHeaderTitle = `${this.gridForm} .panel-heading`;
    this.gridTableNumberOfTitlesSpan = `${this.gridTableHeaderTitle} span.badge`;
    this.gridTable = '#table-country';

    // Filter selectors
    this.filterRow = `${this.gridTable} tr.filter`;
    this.filterColumn = filterBy => `${this.filterRow} [name='countryFilter_${filterBy}']`;
    this.filterSearchButton = '#submitFilterButtoncountry';
    this.filterResetButton = 'button[name=\'submitResetcountry\']';

    // Table rows and columns
    this.tableBody = `${this.gridTable} tbody`;
    this.tableRow = row => `${this.tableBody} tr:nth-child(${row})`;
    this.tableColumn = (row, column) => `${this.tableRow(row)} td:nth-child(${column})`;

    // Columns selectors
    this.tableColumnId = row => this.tableColumn(row, 2);
    this.tableColumnName = row => this.tableColumn(row, 3);
    this.tableColumnIsoCode = row => this.tableColumn(row, 4);
    this.tableColumnCallPrefix = row => this.tableColumn(row, 5);
    this.tableColumnZone = row => this.tableColumn(row, 6);
    this.tableColumnStatusLink = row => `${this.tableColumn(row, 7)} a`;
    this.tableColumnStatusEnableLink = row => `${this.tableColumnStatusLink(row)}.action-enabled`;
    this.tableColumnStatusDisableLink = row => `${this.tableColumn(row)}.action-disabled`;

    // Actions selectors
    this.editRowLink = row => `${this.tableRow(row)} a.edit`;

    // Bulk Actions
    this.bulkActionBlock = 'div.bulk-actions';
    this.bulkActionMenuButton = `${this.gridForm} button.dropdown-toggle`;
    this.bulkActionDropdownMenu = `${this.bulkActionBlock} ul.dropdown-menu`;
    this.selectAllLink = `${this.bulkActionDropdownMenu} li:nth-child(1)`;
    this.bulkEnableLink = `${this.bulkActionDropdownMenu} li:nth-child(4)`;
    this.bulkDisableLink = `${this.bulkActionDropdownMenu} li:nth-child(5)`;
    this.bulkDeleteLink = `${this.bulkActionDropdownMenu} li:nth-child(7)`;
  }

  /*
  Methods
   */
  /**
   * Go to add new country page
   * @param page
   * @returns {Promise<void>}
   */
  async goToAddNewCountryPage(page) {
    await this.clickAndWaitForNavigation(page, this.addNewCountryButton);
  }

  /**
   * Reset filter
   * @param page
   * @returns {Promise<void>}
   */
  async resetFilter(page) {
    if (!(await this.elementNotVisible(page, this.filterResetButton, 2000))) {
      await this.clickAndWaitForNavigation(page, this.filterResetButton);
    }
    await this.waitForVisibleSelector(page, this.filterSearchButton, 2000);
  }

  /**
   * Get number of element in grid
   * @param page
   * @returns {Promise<number>}
   */
  getNumberOfElementInGrid(page) {
    return this.getNumberFromText(page, this.gridTableNumberOfTitlesSpan);
  }

  /**
   * Reset and get number of lines
   * @param page
   * @returns {Promise<number>}
   */
  async resetAndGetNumberOfLines(page) {
    await this.resetFilter(page);
    return this.getNumberOfElementInGrid(page);
  }

  /**
   * Go to edit country page
   * @param page
   * @param countryID
   * @returns {Promise<void>}
   */
  async goToEditCountryPage(page, countryID = 1) {
    await this.clickAndWaitForNavigation(page, this.editRowLink(countryID));
  }

  /**
   * Get text column from table
   * @param page
   * @param row
   * @param columnName
   * @returns {Promise<string>}
   */
  async getTextColumnFromTable(page, row, columnName) {
    let columnSelector;

    switch (columnName) {
      case 'id_country':
        columnSelector = this.tableColumnId(row);
        break;

      case 'b!name':
        columnSelector = this.tableColumnName(row);
        break;

      case 'iso_code':
        columnSelector = this.tableColumnIsoCode(row);
        break;

      case 'call_prefix':
        columnSelector = this.tableColumnCallPrefix(row);
        break;

      case 'z!id_zone':
        columnSelector = this.tableColumnZone(row);
        break;

      default:
        throw new Error(`Column ${columnName} was not found`);
    }

    return this.getTextContent(page, columnSelector);
  }

  /**
   * Filter table
   * @param page
   * @param filterType
   * @param filterBy
   * @param value
   * @returns {Promise<void>}
   */
  async filterTable(page, filterType, filterBy, value) {
    let filterValue = value;
    switch (filterType) {
      case 'input':
        await this.setValue(page, this.filterColumn(filterBy), filterValue.toString());
        await this.clickAndWaitForNavigation(page, this.filterSearchButton);
        break;

      case 'select':
        if (typeof value === 'boolean') {
          filterValue = value ? 'Yes' : 'No';
        }

        await Promise.all([
          this.selectByVisibleText(page, this.filterColumn(filterBy), filterValue),
          page.waitForNavigation({waitUntil: 'networkidle'}),
        ]);

        break;

      default:
        throw new Error(`Filter ${filterBy} was not found`);
    }
  }

  /**
   * Get country status
   * @param page
   * @param row
   * @return {Promise<boolean>}
   */
  getCountryStatus(page, row) {
    return this.elementVisible(page, this.tableColumnStatusEnableLink(row), 1000);
  }

  /**
   * Set country status
   * @param page
   * @param row
   * @param wantedStatus
   * @return {Promise<void>}
   */
  async setCountryStatus(page, row, wantedStatus) {
    if (wantedStatus !== await this.getCountryStatus(page, row)) {
      await this.clickAndWaitForNavigation(page, this.tableColumnStatusLink(row));
    }
  }

  /* Bulk actions methods */

  /**
   * Select all rows
   * @param page
   * @return {Promise<void>}
   */
  async bulkSelectRows(page) {
    await page.click(this.bulkActionMenuButton);

    await Promise.all([
      page.click(this.selectAllLink),
      page.waitForSelector(this.selectAllLink, {state: 'hidden'}),
    ]);
  }

  /**
   * Delete countries by bulk action
   * @param page
   * @returns {Promise<string>}
   */
  async deleteCountriesByBulkActions(page) {
    this.dialogListener(page, true);
    // Select all rows
    await this.bulkSelectRows(page);

    // Click on Button Bulk actions
    await page.click(this.bulkActionMenuButton);

    // Click on delete
    await this.clickAndWaitForNavigation(page, this.bulkDeleteLink);
    return this.getTextContent(page, this.alertSuccessBlock);
  }

  /**
   * Bulk set status
   * @param page
   * @param wantedStatus
   * @return {Promise<void>}
   */
  async bulkSetStatus(page, wantedStatus) {
    // Select all rows
    await this.bulkSelectRows(page);

    // Set status
    await Promise.all([
      page.click(this.bulkActionMenuButton),
      this.waitForVisibleSelector(page, this.bulkEnableLink),
    ]);

    await this.clickAndWaitForNavigation(
      page,
      wantedStatus ? this.bulkEnableLink : this.bulkDisableLink,
    );
  }
}

module.exports = new Countries();
