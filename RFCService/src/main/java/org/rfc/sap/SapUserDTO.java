package org.rfc.sap;

import java.io.Serializable;

public class SapUserDTO implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private String userName;
	private String password;
	private String client;
	
	public SapUserDTO() {
		super();
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getClient() {
		return client;
	}

	public void setClient(String client) {
		this.client = client;
	}
	
	public void copyUser(SapUserDTO user) {
		this.userName=user.userName;
		this.password=user.password;
		this.client=user.client;
	}
	
	public String getUserString() {
		if(this.userName!=null && this.client!=null) {
			return userName+"_"+client;
		}
		else {
			return "No SAP user!";
		}
	}
	
}
