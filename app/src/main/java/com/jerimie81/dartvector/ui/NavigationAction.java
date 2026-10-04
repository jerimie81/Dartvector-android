package com.jerimie81.dartvector.ui;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class NavigationAction {
    public static final String ACTION_SCOREBOARD = "nav-scoreboard-btn";
    public static final String ACTION_SETUP = "nav-setup-btn";
    public static final String ACTION_ANALYTICS = "nav-analytics-btn";
    public static final String ACTION_MULTIPLAYER = "nav-multiplayer-btn";

    private static final NavigationAction SCOREBOARD =
            new NavigationAction("Scoreboard", ACTION_SCOREBOARD, "Open the scoreboard view");
    private static final NavigationAction SETUP =
            new NavigationAction("Setup", ACTION_SETUP, "Open the match setup flow");
    private static final NavigationAction ANALYTICS =
            new NavigationAction("Analytics", ACTION_ANALYTICS, "Open the stats and analytics panel");
    private static final NavigationAction MULTIPLAYER =
            new NavigationAction("Hub", ACTION_MULTIPLAYER, "Open the multiplayer hub");

    private final String title;
    private final String elementId;
    private final String description;

    private NavigationAction(String title, String elementId, String description) {
        this.title = title;
        this.elementId = elementId;
        this.description = description;
    }

    public static NavigationAction fromId(String elementId) {
        for (NavigationAction action : primaryActions()) {
            if (action.elementId.equals(elementId)) {
                return action;
            }
        }
        return null;
    }

    public static List<NavigationAction> primaryActions() {
        return Collections.unmodifiableList(Arrays.asList(
                SCOREBOARD,
                SETUP,
                ANALYTICS,
                MULTIPLAYER
        ));
    }

    public String getTitle() {
        return title;
    }

    public String getElementId() {
        return elementId;
    }

    public String getDescription() {
        return description;
    }
}
