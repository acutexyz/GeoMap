Feature: Allow users to login and logout

  As a user of the app
  I want to login and logout
  So that I can prove my identity and use the app

  @dev
  Background:
    Given I am signed out

  @dev
  Scenario: Objects page should require login
    Given I am on the objects page
    Then I should be redirected to login page

  @dev
  Scenario: Geoportal page should require login
    Given I am on the geoportal page
    Then I should be redirected to login page

  @dev
  Scenario: A user can login with valid information
    Given I am on the login page
    And I enter my authentication information
    Then I should be logged in

  @dev
  Scenario: A user cannot login with bad information
    Given I am on the login page
    And I enter incorrect authentication information
    Then I should see a user not found error