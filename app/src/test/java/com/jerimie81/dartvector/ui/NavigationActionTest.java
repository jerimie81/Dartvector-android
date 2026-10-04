package com.jerimie81.dartvector.ui;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.util.List;
import org.junit.Test;

public class NavigationActionTest {
    @Test
    public void fromId_returnsExpectedAction() {
        NavigationAction action = NavigationAction.fromId("nav-scoreboard-btn");

        assertNotNull(action);
        assertEquals("Scoreboard", action.getTitle());
        assertEquals("nav-scoreboard-btn", action.getElementId());
    }

    @Test
    public void primaryActionsIncludeCoreFlows() {
        List<NavigationAction> actions = NavigationAction.primaryActions();

        assertEquals(4, actions.size());
        assertEquals("nav-scoreboard-btn", actions.get(0).getElementId());
        assertEquals("nav-setup-btn", actions.get(1).getElementId());
        assertEquals("nav-analytics-btn", actions.get(2).getElementId());
        assertEquals("nav-multiplayer-btn", actions.get(3).getElementId());
    }

    @Test
    public void fromId_returnsFallbackForUnknownId() {
        NavigationAction action = NavigationAction.fromId("does-not-exist");

        assertNotNull(action);
        assertEquals("", action.getElementId());
    }

    @Test
    public void fromId_returnsFallbackForNullId() {
        NavigationAction action = NavigationAction.fromId(null);

        assertNotNull(action);
        assertEquals("", action.getElementId());
    }
}
