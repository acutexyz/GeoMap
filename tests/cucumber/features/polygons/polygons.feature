Feature: Allow users to draw polygons on the map

  As a user of the app
  I want to draw and store polygons on the map
  So that I can specify territories on the map

  @dev
  Scenario: User can draw a polygon by clicking on the map
    Given I am logged in
    And I am on the geoportal page
    When I click the "Draw" button
    And I click on the right part of the map
    And I click on the left part of the map
    And I double click on the bottom part of the map
    Then the polygons counter should be equal to 1